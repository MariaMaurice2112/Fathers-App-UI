import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import { APP_NAME } from '@/constants';

export const metadata: Metadata = {
  title: `${APP_NAME} — المتابعة الرعوية`,
  description: 'نظام المتابعة الرعوية للأبناء الروحيين',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
