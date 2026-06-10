'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/app/admin/components/ui';

const GOOGLE_KEY = 'seo_google_verification';
const BING_KEY = 'seo_bing_verification';

export const SeoSiteVerificationPanel = (): React.ReactElement => {
  const settings = useQuery(api.settings.getMultiple, {
    keys: [GOOGLE_KEY, BING_KEY],
  });
  const setMultiple = useMutation(api.settings.setMultiple);

  const [googleToken, setGoogleToken] = useState('');
  const [bingToken, setBingToken] = useState('');
  const [initialGoogleToken, setInitialGoogleToken] = useState('');
  const [initialBingToken, setInitialBingToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!settings) {
      return;
    }

    const google = typeof settings[GOOGLE_KEY] === 'string' ? settings[GOOGLE_KEY] : '';
    const bing = typeof settings[BING_KEY] === 'string' ? settings[BING_KEY] : '';

    setGoogleToken(google);
    setBingToken(bing);
    setInitialGoogleToken(google);
    setInitialBingToken(bing);
  }, [settings]);

  const hasChanges = useMemo(
    () => googleToken !== initialGoogleToken || bingToken !== initialBingToken,
    [bingToken, googleToken, initialBingToken, initialGoogleToken],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setMultiple({
        settings: [
          { group: 'seo', key: GOOGLE_KEY, value: googleToken.trim() },
          { group: 'seo', key: BING_KEY, value: bingToken.trim() },
        ],
      });

      setInitialGoogleToken(googleToken);
      setInitialBingToken(bingToken);
      toast.success('Đã lưu mã xác minh Google/Bing');
    } catch {
      toast.error('Không thể lưu mã xác minh, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  if (settings === undefined) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Verification (Google / Bing)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seo-google-verification">Google verification token</Label>
          <Input
            id="seo-google-verification"
            value={googleToken}
            onChange={(event) => setGoogleToken(event.target.value)}
            placeholder="VD: M_4ZKEZ30LCdbEftU2mpaV9O2Pad57Mt3LuhNdvOU7U"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-bing-verification">Bing verification token (msvalidate.01)</Label>
          <Input
            id="seo-bing-verification"
            value={bingToken}
            onChange={(event) => setBingToken(event.target.value)}
            placeholder="VD: 9B303080DC2D655419DD32E2EFE2D686"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {hasChanges ? (
            <span className="text-xs text-amber-600 dark:text-amber-400">Có thay đổi chưa lưu</span>
          ) : (
            <span className="text-xs text-slate-500">Token được inject vào metadata tại Root Layout</span>
          )}
          <Button variant="accent" size="sm" onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
            Lưu verification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
