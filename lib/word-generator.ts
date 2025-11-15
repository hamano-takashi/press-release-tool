/**
 * Wordドキュメント生成
 * プレスリリースの内容をWord形式で出力するための関数
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
} from 'docx'
import { PressRelease } from '@/types'
import { saveAs } from 'file-saver'
import { toAppError, getUserFriendlyMessage } from './error-handler'

/**
 * 日付を日本語形式でフォーマットします
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Base64画像をBufferに変換します
 */
async function base64ToBuffer(base64: string): Promise<Buffer> {
  // data:image/png;base64, のプレフィックスを除去
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
  return Buffer.from(base64Data, 'base64')
}

/**
 * Wordドキュメントを生成してダウンロードします
 * @param pressRelease - プレスリリースデータ
 */
export async function generateWord(pressRelease: PressRelease): Promise<void> {
  try {
    const releaseDate = pressRelease.releaseDate
      ? typeof pressRelease.releaseDate === 'string'
        ? new Date(pressRelease.releaseDate)
        : pressRelease.releaseDate
      : new Date()

    const formattedDate = formatDate(releaseDate)

    // ヘッダー部分の段落を作成
    const headerParagraphs: Paragraph[] = []

    // ヘッダーテーブル（報道関係各位、ロゴ、日付・会社名を横並び）
    const headerCells: TableCell[] = []

    // 左側: 報道関係各位
    headerCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: '報道関係各位',
                bold: true,
                size: 22,
              }),
            ],
            alignment: AlignmentType.LEFT,
            border: {
              top: {
                color: '999999',
                size: 2,
                style: BorderStyle.SINGLE,
              },
              bottom: {
                color: '999999',
                size: 2,
                style: BorderStyle.SINGLE,
              },
              left: {
                color: '999999',
                size: 2,
                style: BorderStyle.SINGLE,
              },
              right: {
                color: '999999',
                size: 2,
                style: BorderStyle.SINGLE,
              },
            },
            shading: {
              fill: 'F5F5F5',
            },
            spacing: {
              before: 200,
              after: 200,
            },
          }),
        ],
        width: {
          size: 33,
          type: WidthType.PERCENTAGE,
        },
      })
    )

    // 中央: ロゴ画像
    const logoCellChildren: Paragraph[] = []
    if (pressRelease.logoImage) {
      try {
        const logoBuffer = await base64ToBuffer(pressRelease.logoImage.url)
        logoCellChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: logoBuffer,
                transformation: {
                  width: 200,
                  height: 60,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        )
      } catch (error) {
        console.warn('ロゴ画像の読み込みに失敗しました:', error)
      }
    }
    headerCells.push(
      new TableCell({
        children: logoCellChildren.length > 0 ? logoCellChildren : [new Paragraph({ text: '' })],
        width: {
          size: 34,
          type: WidthType.PERCENTAGE,
        },
      })
    )

    // 右側: 日付と会社名
    const rightCellChildren: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: formattedDate,
            size: 20,
          }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
    ]
    if (pressRelease.companyName) {
      rightCellChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: pressRelease.companyName,
              bold: true,
              size: 20,
            }),
          ],
          alignment: AlignmentType.RIGHT,
        })
      )
    }
    headerCells.push(
      new TableCell({
        children: rightCellChildren,
        width: {
          size: 33,
          type: WidthType.PERCENTAGE,
        },
      })
    )

    headerParagraphs.push(
      new Paragraph({
        children: [
          new Table({
            rows: [
              new TableRow({
                children: headerCells,
              }),
            ],
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      })
    )

    // タイトル
    const titleParagraphs: Paragraph[] = []
    if (pressRelease.title) {
      titleParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: pressRelease.title,
              bold: true,
              size: 48,
            }),
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
          },
        })
      )
    }

    if (pressRelease.subtitle) {
      titleParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: pressRelease.subtitle,
              size: 36,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
          },
        })
      )
    }

    // 導入段落
    const introductionParagraphs: Paragraph[] = []
    if (pressRelease.introduction) {
      introductionParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: pressRelease.introduction,
              size: 24,
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: {
            after: 600,
          },
        })
      )
    }

    // メイン画像とスローガン
    const mainImageParagraphs: Paragraph[] = []
    if (pressRelease.slogan) {
      mainImageParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: pressRelease.slogan,
              bold: true,
              size: 32,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
          },
        })
      )
    }

    if (pressRelease.mainImage) {
      try {
        const mainImageBuffer = await base64ToBuffer(pressRelease.mainImage.url)
        mainImageParagraphs.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: mainImageBuffer,
                transformation: {
                  width: 500,
                  height: 400,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 600,
            },
          })
        )
      } catch (error) {
        console.warn('メイン画像の読み込みに失敗しました:', error)
      }
    }

    // セクション
    const sectionParagraphs: Paragraph[] = []
    pressRelease.sections.forEach((section) => {
      sectionParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `■${section.title || 'セクションタイトル'}`,
              bold: true,
              size: 36,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 400,
            after: 400,
          },
        })
      )

      // セクションの内容を行ごとに分割
      const contentLines = section.content.split('\n')
      contentLines.forEach((line) => {
        if (line.trim()) {
          sectionParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 24,
                }),
              ],
              spacing: {
                after: 200,
              },
            })
          )
        }
      })
    })

    // その他画像
    const additionalImageParagraphs: Paragraph[] = []
    if (pressRelease.additionalImages.length > 0) {
      for (const img of pressRelease.additionalImages) {
        try {
          const imgBuffer = await base64ToBuffer(img.url)
          additionalImageParagraphs.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imgBuffer,
                  transformation: {
                    width: 300,
                    height: 200,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
              },
            })
          )
        } catch (error) {
          console.warn('画像の読み込みに失敗しました:', error)
        }
      }
    }

    // 問い合わせ先
    const contactParagraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: '＜この件に関するマスコミ、素材・データなどの問い合わせ＞',
            bold: true,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 800,
          after: 400,
        },
        border: {
          top: {
            color: 'CCCCCC',
            size: 1,
            style: BorderStyle.SINGLE,
          },
        },
      }),
    ]

    if (pressRelease.contact.name) {
      contactParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${pressRelease.companyName || ''} 広報担当: ${pressRelease.contact.name}`,
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 200,
          },
        })
      )
    }

    if (pressRelease.contact.phone) {
      contactParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `電話番号: ${pressRelease.contact.phone}`,
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 200,
          },
        })
      )
    }

    if (pressRelease.contact.email) {
      contactParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `mail: ${pressRelease.contact.email}`,
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 200,
          },
        })
      )
    }

    // ドキュメントを作成
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            ...headerParagraphs,
            ...titleParagraphs,
            ...introductionParagraphs,
            ...mainImageParagraphs,
            ...sectionParagraphs,
            ...additionalImageParagraphs,
            ...contactParagraphs,
          ],
        },
      ],
    })

    // Wordファイルを生成
    const blob = await Packer.toBlob(doc)

    // ファイル名を生成
    const timestamp = pressRelease.id || Date.now()
    const sanitizedTitle = pressRelease.title
      ? pressRelease.title.replace(/[^\w\s-]/g, '').substring(0, 30)
      : 'press-release'

    // ダウンロード
    saveAs(blob, `${sanitizedTitle}-${timestamp}.docx`)
  } catch (error) {
    console.error('Word generation error:', error)
    const appError = toAppError(error)
    const errorMessage = getUserFriendlyMessage(appError)
    throw new Error(`Word出力に失敗しました: ${errorMessage}`)
  }
}

