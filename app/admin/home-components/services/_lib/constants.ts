import type { ServicesConfig } from '../_types';
import { DEFAULT_SERVICES_CORNER_RADIUS, DEFAULT_SERVICES_SPACING } from '../_types';

export const DEFAULT_SERVICES_CONFIG: ServicesConfig = {
  items: [
    {
      mediaType: 'icon',
      description: '',
      icon: 'Star',
      image: '',
      title: '',
    },
  ],
  showTitle: true,
  subtitle: '',
  showSubtitle: true,
  headerAlign: 'left',
  mediaPlacement: 'top',
  mediaAlign: 'center',
  desktopColumns: 3,
  style: 'elegantGrid',
  // Shared header config
  hideHeader: false,
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  spacing: DEFAULT_SERVICES_SPACING,
  cornerRadius: DEFAULT_SERVICES_CORNER_RADIUS,
};

export const AVAILABLE_SERVICE_ICONS = [
  // ★ Rất phổ biến — dùng nhiều nhất trong e-commerce / dịch vụ
  'Star', 'Heart', 'ShoppingCart', 'Truck', 'ShieldCheck', 'Package',
  'CreditCard', 'Phone', 'Mail', 'MapPin', 'Clock', 'Check',
  'Gift', 'Zap', 'Sparkles', 'Home', 'Users', 'Settings',
  'Award', 'Tag', 'Store', 'Rocket', 'Lightbulb', 'Shield',
  'Wallet', 'Bell', 'ShoppingBag', 'Handshake', 'Globe', 'Lock',

  // ★★ Phổ biến — thường gặp trong dịch vụ, marketing
  'HeartPulse', 'HeartHandshake', 'CheckCircle', 'Send', 'Target',
  'Trophy', 'Crown', 'Gem', 'Flame', 'ThumbsUp', 'Eye',
  'Bookmark', 'Megaphone', 'Camera', 'Coffee', 'Utensils',
  'Car', 'Plane', 'Building', 'Building2', 'Hotel', 'Key',
  'Briefcase', 'GraduationCap', 'Book', 'Headphones', 'Music',
  'Sun', 'Leaf', 'Smile', 'UserCheck', 'WandSparkles',

  // ★★★ Khá phổ biến — dùng theo ngành cụ thể
  'Ambulance', 'Stethoscope', 'Hospital', 'Pill', 'Baby',
  'Dumbbell', 'Brain', 'Laptop', 'Smartphone', 'Wifi',
  'Code', 'Database', 'Server', 'Cloud', 'Bot',
  'Hammer', 'Wrench', 'Paintbrush', 'Scissors', 'Ruler',
  'Ship', 'Train', 'Bike', 'Bus',
  'Apple', 'Pizza', 'ChefHat', 'Wine', 'Beer',
  'Dog', 'Cat', 'Fish', 'Bird', 'TreePine',

  // ★★★★ Trung bình — icon bổ sung hữu ích
  'Printer', 'Calculator', 'Receipt', 'FileText', 'FileCheck2',
  'Layers', 'Puzzle', 'Power', 'Gauge', 'Timer',
  'Compass', 'Map', 'Flag', 'Navigation', 'Anchor',
  'Fingerprint', 'QrCode', 'ScanSearch', 'Barcode', 'Scan',
  'Palette', 'PenTool', 'Aperture', 'Film', 'Image',
  'Video', 'Mic', 'Podcast', 'Radio', 'Speaker',
  'MessageCircle', 'MessagesSquare', 'Inbox', 'MailOpen', 'Share2',
  'Download', 'Upload', 'Link', 'Monitor', 'MonitorSmartphone',
  'CalendarCheck2', 'AlarmClock', 'Watch', 'Hourglass', 'Infinity',

  // ★★★★★ Ít phổ biến hơn — icon chuyên biệt
  'Banknote', 'Coins', 'DollarSign', 'CircleDollarSign', 'PiggyBank',
  'HandCoins', 'BadgePercent', 'Percent', 'Scale', 'TrendingUp',
  'ChartColumn', 'ChartLine', 'ChartPie', 'BarChart3', 'LineChart',
  'Activity', 'Landmark', 'Warehouse', 'Factory', 'Construction',
  'Network', 'Signal', 'Router', 'HardDrive',
  'Cpu', 'Terminal', 'Webhook', 'BrainCircuit', 'CircuitBoard',
  'Binary', 'Nfc', 'Plug', 'Usb', 'Cable',

  // ★★★★★★ Niche — dùng ít, phù hợp ngành đặc thù
  'Syringe', 'Microscope', 'Dna', 'Thermometer', 'ThermometerSun',
  'Bone', 'Ear', 'Footprints', 'Cross', 'LifeBuoy',
  'Cake', 'CakeSlice', 'Candy', 'Cherry', 'Croissant',
  'Egg', 'Grape', 'Ham', 'Sandwich', 'Soup',
  'Popcorn', 'IceCreamCone', 'Milk', 'GlassWater', 'Banana',
  'Bean', 'Citrus', 'Nut', 'Wheat', 'CookingPot',
  'Flower', 'Flower2', 'Sprout', 'Moon', 'Sunrise',
  'Mountain', 'MountainSnow', 'Waves', 'Wind', 'Droplets',
  'Snowflake', 'CloudSun', 'CloudRain', 'CloudSnow', 'Rainbow',
  'Tornado', 'Umbrella', 'Palmtree', 'Trees', 'Shell',
  'Feather', 'Fuel', 'CarFront', 'Sailboat', 'PlaneLanding', 'PlaneTakeoff',
  'Bath', 'Bed', 'BedDouble', 'Armchair', 'Sofa',
  'AirVent', 'Lamp', 'LampDesk', 'Microwave', 'Refrigerator',
  'WashingMachine', 'DoorOpen', 'BookOpen', 'Clapperboard', 'Gamepad2',
  'KeyRound', 'Tv', 'Tablet', 'ToggleRight', 'BatteryCharging',
  'Beaker', 'FlaskConical', 'BookMarked', 'NotebookPen', 'Pen',
  'School', 'University', 'Library', 'Languages', 'Telescope',
  'Guitar', 'Piano', 'Projector', 'Contact', 'Contact2',
  'PhoneCall', 'Voicemail', 'Rss', 'Bluetooth', 'AtSign',
  'Waypoints', 'Radar', 'CloudCog', 'Code2', 'Mouse', 'MousePointerClick',
  'UserPlus', 'UsersRound', 'SmilePlus', 'HandHeart', 'Ribbon',
  'Vote', 'Diamond', 'Hexagon', 'Wand',
  'Locate', 'MapPinned', 'Milestone', 'MoveRight', 'Route', 'Signpost',
  'Crosshair', 'Cog', 'Fan', 'Fence', 'Drill',
  'PaintBucket', 'Pipette', 'Screwdriver', 'Shovel', 'Axe',
  'Tags', 'Ticket', 'Box', 'Newspaper', 'Paperclip',
  'Recycle', 'Siren', 'Swords', 'Tent', 'Volleyball',
  'Binoculars', 'Blocks', 'Dices', 'Drama', 'Bug',
] as const;

