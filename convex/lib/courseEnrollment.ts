import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type DbCtx = QueryCtx | MutationCtx;

export function isCancelledOrRefundedOrderStatus(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("cancel") ||
    normalized.includes("refund") ||
    normalized.includes("huy") ||
    normalized.includes("hủy") ||
    normalized.includes("hoan-tien") ||
    normalized.includes("hoantien") ||
    normalized.includes("hoàn tiền") ||
    normalized.includes("hoàn-tiền")
  );
}

export function isCompletedOrderStatus(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("complete") ||
    normalized.includes("completed") ||
    normalized.includes("delivered") ||
    normalized.includes("done") ||
    normalized.includes("hoan-thanh") ||
    normalized.includes("hoanthanh") ||
    normalized.includes("hoàn thành")
  );
}

export function orderCanUnlockCourse(order: Doc<"orders">) {
  if (order.paymentStatus === "Refunded" || order.paymentStatus === "Failed") {
    return false;
  }
  if (isCancelledOrRefundedOrderStatus(order.status)) {
    return false;
  }
  return order.paymentStatus === "Paid" || isCompletedOrderStatus(order.status);
}

export function getProgressPercent(completedLessonsCount: number, lessonCount: number) {
  if (lessonCount <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((completedLessonsCount / lessonCount) * 100));
}

export async function resolveCustomerIdByToken(ctx: DbCtx, token?: string | null) {
  if (!token || !token.startsWith("cus_")) {
    return null;
  }

  const session = await ctx.db
    .query("customerSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  const customer = await ctx.db.get(session.customerId);
  if (!customer || customer.status !== "Active") {
    return null;
  }

  return customer._id;
}

export async function getCourseStudent(
  ctx: DbCtx,
  customerId: Id<"customers">,
  courseId: Id<"courses">
) {
  return ctx.db
    .query("courseStudents")
    .withIndex("by_courseId_and_customerId", (q) =>
      q.eq("courseId", courseId).eq("customerId", customerId)
    )
    .unique();
}

export async function getActiveLessonCount(ctx: DbCtx, courseId: Id<"courses">) {
  const lessons = await ctx.db
    .query("courseLessons")
    .withIndex("by_course_active_order", (q) => q.eq("courseId", courseId).eq("active", true))
    .take(500);
  return lessons.length;
}

export async function getFirstActiveLesson(ctx: DbCtx, courseId: Id<"courses">) {
  const [chapters, lessons] = await Promise.all([
    ctx.db
      .query("courseChapters")
      .withIndex("by_course_active_order", (q) => q.eq("courseId", courseId).eq("active", true))
      .take(200),
    ctx.db
      .query("courseLessons")
      .withIndex("by_course_active_order", (q) => q.eq("courseId", courseId).eq("active", true))
      .take(500),
  ]);

  const chapterOrderMap = new Map(chapters.map((chapter) => [chapter._id, chapter.order]));
  return lessons.sort((a, b) => {
    const chapterDiff = (chapterOrderMap.get(a.chapterId) ?? 0) - (chapterOrderMap.get(b.chapterId) ?? 0);
    return chapterDiff === 0 ? a.order - b.order : chapterDiff;
  })[0] ?? null;
}

export async function customerHasCourseOrderAccess(
  ctx: DbCtx,
  customerId: Id<"customers">,
  courseId: Id<"courses">,
  excludeOrderId?: Id<"orders">
) {
  const orders = await ctx.db
    .query("orders")
    .withIndex("by_customer", (q) => q.eq("customerId", customerId))
    .order("desc")
    .take(500);

  return orders.some((order) =>
    order._id !== excludeOrderId &&
    orderCanUnlockCourse(order) &&
    order.items.some((item) =>
      (item.itemType ?? "product") === "course" &&
      item.courseId === courseId
    )
  );
}

export async function ensureCourseStudentForCustomerCourse(
  ctx: MutationCtx,
  customerId: Id<"customers">,
  courseId: Id<"courses">,
  source: { sourceType: "order" | "free" | "manual"; sourceOrderId?: Id<"orders"> }
) {
  const now = Date.now();
  const existing = await getCourseStudent(ctx, customerId, courseId);
  const lessonCountSnapshot = await getActiveLessonCount(ctx, courseId);

  if (existing) {
    await ctx.db.patch(existing._id, {
      lessonCountSnapshot,
      sourceOrderId: source.sourceOrderId ?? existing.sourceOrderId,
      sourceType: source.sourceType,
      status: "active",
      updatedAt: now,
    });
    return existing._id;
  }

  return ctx.db.insert("courseStudents", {
    completedLessonsCount: 0,
    courseId,
    customerId,
    enrolledAt: now,
    lessonCountSnapshot,
    ...(source.sourceOrderId ? { sourceOrderId: source.sourceOrderId } : {}),
    sourceType: source.sourceType,
    status: "active",
    updatedAt: now,
  });
}

function buildCertificateCode(studentId: Id<"courseStudents">) {
  return `CERT-${studentId.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

export async function recalculateCourseStudentProgress(
  ctx: MutationCtx,
  studentId: Id<"courseStudents">,
  lastLessonId?: Id<"courseLessons">
) {
  const student = await ctx.db.get(studentId);
  if (!student) {
    return null;
  }

  const [lessonCountSnapshot, progressRows] = await Promise.all([
    getActiveLessonCount(ctx, student.courseId),
    ctx.db
      .query("courseLessonProgress")
      .withIndex("by_courseId_and_customerId", (q) =>
        q.eq("courseId", student.courseId).eq("customerId", student.customerId)
      )
      .take(500),
  ]);

  const now = Date.now();
  const completedLessonsCount = progressRows.length;
  const isCompleted = lessonCountSnapshot > 0 && completedLessonsCount >= lessonCountSnapshot;
  const certificateIssuedAt = isCompleted ? (student.certificateIssuedAt ?? now) : undefined;
  const certificateCode = isCompleted ? (student.certificateCode ?? buildCertificateCode(student._id)) : undefined;

  await ctx.db.patch(student._id, {
    certificateCode,
    certificateIssuedAt,
    completedAt: isCompleted ? (student.completedAt ?? now) : undefined,
    completedLessonsCount,
    lastActivityAt: now,
    lastLessonId: lastLessonId ?? student.lastLessonId,
    lessonCountSnapshot,
    updatedAt: now,
  });

  return ctx.db.get(student._id);
}

export async function syncCourseStudentsForOrder(ctx: MutationCtx, orderId: Id<"orders">) {
  const order = await ctx.db.get(orderId);
  if (!order) {
    return;
  }

  const courseIds = Array.from(new Set(order.items
    .filter((item) => (item.itemType ?? "product") === "course" && item.courseId)
    .map((item) => item.courseId!)
  ));
  if (courseIds.length === 0) {
    return;
  }

  const canUnlock = orderCanUnlockCourse(order);
  for (const courseId of courseIds) {
    const existing = await getCourseStudent(ctx, order.customerId, courseId);
    if (canUnlock) {
      await ensureCourseStudentForCustomerCourse(ctx, order.customerId, courseId, {
        sourceOrderId: order._id,
        sourceType: "order",
      });
      continue;
    }

    if (!existing || existing.sourceOrderId !== order._id) {
      continue;
    }

    const hasOtherValidOrder = await customerHasCourseOrderAccess(ctx, order.customerId, courseId, order._id);
    if (!hasOtherValidOrder) {
      await ctx.db.patch(existing._id, {
        status: "revoked",
        updatedAt: Date.now(),
      });
    }
  }
}
