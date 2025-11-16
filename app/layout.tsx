import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // フォントの読み込み方法を最適化
  preload: true, // プリロードを有効化
})

export const metadata: Metadata = {
  title: 'プレスリリース原稿作成ツール',
  description: '簡単にプレスリリース原稿を作成し、PDF・Word形式で出力できるWebアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

