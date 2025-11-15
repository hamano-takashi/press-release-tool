/**
 * PDFドキュメント生成コンポーネント
 * プレスリリースの内容をPDF形式で出力するためのコンポーネント
 */

import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'
import { PressRelease } from '@/types'
import { registerJapaneseFont, getFontFamily } from './pdf-fonts'

// フォントを登録（エラーが発生しても続行）
try {
  registerJapaneseFont()
} catch (error) {
  console.warn('Font registration failed, using default font:', error)
}

// フォントファミリー名を取得（スタイル定義前に実行）
const FONT_FAMILY = getFontFamily()

// スタイル定義
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: FONT_FAMILY,
    lineHeight: 1.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
    width: '100%',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 0,
  },
  mediaBox: {
    borderWidth: 2,
    borderColor: '#999999',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  mediaText: {
    fontSize: 11,
    fontWeight: 700,
    color: '#333333',
    fontFamily: FONT_FAMILY,
  },
  logo: {
    maxHeight: 60,
    width: 'auto',
  },
  dateText: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 700,
    color: '#000000',
    fontFamily: FONT_FAMILY,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 10,
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    lineHeight: 1.4,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#333333',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    lineHeight: 1.4,
  },
  introductionContainer: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  introduction: {
    fontSize: 12,
    lineHeight: 2.0,
    color: '#000000',
    textAlign: 'left',
    maxWidth: '95%',
    fontFamily: FONT_FAMILY,
  },
  mainImageContainer: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  slogan: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  image: {
    maxWidth: '90%',
    maxHeight: 400,
    marginVertical: 10,
  },
  sectionContainer: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 12,
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  sectionContent: {
    fontSize: 12,
    lineHeight: 2.0,
    marginBottom: 15,
    color: '#000000',
    textAlign: 'left',
    maxWidth: '95%',
    fontFamily: FONT_FAMILY,
  },
  additionalImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 25,
    width: '100%',
  },
  additionalImage: {
    maxWidth: '45%',
    maxHeight: 200,
    margin: 5,
  },
  contactSection: {
    marginTop: 35,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    alignItems: 'center',
    width: '100%',
  },
  contactTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 10,
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  contactText: {
    fontSize: 11,
    lineHeight: 1.8,
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    marginBottom: 3,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666666',
    fontFamily: FONT_FAMILY,
  },
  pageBreak: {
    marginBottom: 20,
  },
})

interface PDFDocumentProps {
  pressRelease: PressRelease
}

/**
 * 日付を日本語形式でフォーマットします
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * PDFドキュメントコンポーネント
 * 複数ページ対応と自動改ページ機能を実装
 */
export function PDFDocument({ pressRelease }: PDFDocumentProps) {
  const releaseDate = pressRelease.releaseDate
    ? typeof pressRelease.releaseDate === 'string'
      ? new Date(pressRelease.releaseDate)
      : pressRelease.releaseDate
    : new Date()

  const formattedDate = formatDate(releaseDate)

  return (
    <Document>
      <Page 
        size="A4" 
        style={styles.page}
      >
        {/* ヘッダー - 横並びレイアウト */}
        <View style={styles.header} wrap={false}>
          {/* 左側: 報道関係各位 */}
          <View style={styles.headerLeft}>
            <View style={styles.mediaBox}>
              <Text style={styles.mediaText}>報道関係各位</Text>
            </View>
          </View>

          {/* 中央: ロゴ画像 */}
          <View style={styles.headerCenter}>
            {pressRelease.logoImage && (
              <Image src={pressRelease.logoImage.url} style={styles.logo} />
            )}
          </View>

          {/* 右側: 日付と企業名 */}
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            {pressRelease.companyName && (
              <Text style={styles.companyName}>{pressRelease.companyName}</Text>
            )}
          </View>
        </View>

        {/* タイトル */}
        {pressRelease.title && (
          <View style={styles.titleContainer} wrap={false}>
            <Text style={styles.title}>{pressRelease.title}</Text>
            {pressRelease.subtitle && (
              <Text style={styles.subtitle}>{pressRelease.subtitle}</Text>
            )}
          </View>
        )}

        {/* 導入段落 */}
        {pressRelease.introduction && (
          <View style={styles.introductionContainer}>
            <Text style={styles.introduction}>{pressRelease.introduction}</Text>
          </View>
        )}

        {/* メイン画像 */}
        {pressRelease.mainImage && (
          <View style={styles.mainImageContainer} break>
            {pressRelease.slogan && (
              <Text style={styles.slogan}>{pressRelease.slogan}</Text>
            )}
            <Image src={pressRelease.mainImage.url} style={styles.image} />
          </View>
        )}

        {/* セクション */}
        {pressRelease.sections.map((section, index) => (
          <View 
            key={section.id} 
            style={styles.sectionContainer}
            break={index > 0}
          >
            <Text style={styles.sectionTitle}>■{section.title || 'セクションタイトル'}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* その他画像 */}
        {pressRelease.additionalImages.length > 0 && (
          <View style={styles.additionalImagesContainer} break>
            {pressRelease.additionalImages.map((img) => (
              <Image key={img.id} src={img.url} style={styles.additionalImage} />
            ))}
          </View>
        )}

        {/* 問い合わせ先 */}
        <View style={styles.contactSection} break>
          <Text style={styles.contactTitle}>
            ＜この件に関するマスコミ、素材・データなどの問い合わせ＞
          </Text>
          {pressRelease.contact.name && (
            <Text style={styles.contactText}>
              {pressRelease.companyName || ''} 広報担当: {pressRelease.contact.name}
            </Text>
          )}
          {pressRelease.contact.phone && (
            <Text style={styles.contactText}>電話番号: {pressRelease.contact.phone}</Text>
          )}
          {pressRelease.contact.email && (
            <Text style={styles.contactText}>mail: {pressRelease.contact.email}</Text>
          )}
        </View>

        {/* ページ番号（2ページ目以降に表示） */}
        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => 
            pageNumber > 1 ? `${pageNumber} / ${totalPages}` : ''
          } 
          fixed
        />
      </Page>
    </Document>
  )
}
