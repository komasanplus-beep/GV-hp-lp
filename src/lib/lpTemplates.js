/**
 * lpTemplates
 * LP テンプレートデータ定義（3パターン固定）
 */

export const LP_TEMPLATES = {
  minimal: {
    id: 'minimal',
    name: '高級ミニマルLP',
    description: '余白を活かした洗練された印象。ハイエンド商材向け',
    preview_color: 'from-slate-900 to-slate-700',
    blocks: [
      {
        block_type: 'Hero',
        sort_order: 0,
        data: {
          headline: 'あなたのビジネスを次のステップへ',
          subheadline: '洗練されたデザインで信頼を構築',
          cta_text: 'はじめる',
          cta_url: '#contact',
          background_type: 'gradient',
          text_align: 'center',
        },
      },
      {
        block_type: 'Problem',
        sort_order: 1,
        data: {
          headline: '現在の課題',
          description: '多くの企業が抱える悩みに対応します',
          items: [
            { icon: '💡', title: '課題1', description: '説明を入力' },
            { icon: '⚡', title: '課題2', description: '説明を入力' },
            { icon: '🎯', title: '課題3', description: '説明を入力' },
          ],
          layout: 'grid',
        },
      },
      {
        block_type: 'Solution',
        sort_order: 2,
        data: {
          headline: '私たちのソリューション',
          description: '効率的で確実な解決法',
          key_benefits: [
            '高速導入',
            '継続サポート',
            'カスタマイズ対応',
          ],
          image_url: '',
        },
      },
      {
        block_type: 'Evidence',
        sort_order: 3,
        data: {
          headline: '実績',
          stats: [
            { label: '導入企業', value: '500+' },
            { label: '満足度', value: '98%' },
            { label: '継続率', value: '95%' },
          ],
        },
      },
      {
        block_type: 'CTA',
        sort_order: 4,
        data: {
          headline: 'さあ、始めましょう',
          description: '今すぐ無料で試す',
          cta_text: '詳細を見る',
          cta_url: '#contact',
          cta_type: 'primary',
        },
      },
    ],
  },

  story: {
    id: 'story',
    name: 'ストーリーLP',
    description: '物語性を持たせた訴求。感情と共感に訴える',
    preview_color: 'from-amber-600 to-orange-600',
    blocks: [
      {
        block_type: 'Hero',
        sort_order: 0,
        data: {
          headline: 'ある日、人生が変わった',
          subheadline: '○○さんのストーリー',
          cta_text: '詳しく見る',
          cta_url: '#story',
          background_type: 'image',
          text_align: 'center',
        },
      },
      {
        block_type: 'Voice',
        sort_order: 1,
        data: {
          headline: 'お客様の声',
          testimonials: [
            {
              text: '使用する前と後で大きく変わりました',
              author: '○○さん',
              role: '企業経営者',
              image_url: '',
            },
            {
              text: 'これ以上にはないサービスです',
              author: '△△さん',
              role: 'マネージャー',
              image_url: '',
            },
          ],
        },
      },
      {
        block_type: 'Feature',
        sort_order: 2,
        data: {
          headline: 'こんな特徴があります',
          features: [
            { title: '特徴1', description: '説明を入力' },
            { title: '特徴2', description: '説明を入力' },
            { title: '特徴3', description: '説明を入力' },
            { title: '特徴4', description: '説明を入力' },
          ],
          layout: 'grid',
        },
      },
      {
        block_type: 'Flow',
        sort_order: 3,
        data: {
          headline: '3ステップで完了',
          steps: [
            { number: 1, title: 'ステップ1', description: '説明を入力' },
            { number: 2, title: 'ステップ2', description: '説明を入力' },
            { number: 3, title: 'ステップ3', description: '説明を入力' },
          ],
        },
      },
      {
        block_type: 'CTA',
        sort_order: 4,
        data: {
          headline: 'あなたも始めてみませんか',
          description: '今から人生が変わる可能性が',
          cta_text: '無料で始める',
          cta_url: '#contact',
          cta_type: 'primary',
        },
      },
    ],
  },

  card: {
    id: 'card',
    name: 'カードLP',
    description: 'サービス・商品の比較や選択肢を提示する構成',
    preview_color: 'from-blue-600 to-cyan-600',
    blocks: [
      {
        block_type: 'Hero',
        sort_order: 0,
        data: {
          headline: 'あなたに合わせた3つの選択肢',
          subheadline: 'ニーズに応じたプランをご用意',
          cta_text: 'プランを比較',
          cta_url: '#pricing',
          background_type: 'solid',
          text_align: 'center',
        },
      },
      {
        block_type: 'Feature',
        sort_order: 1,
        data: {
          headline: '3つのプラン',
          features: [
            {
              title: 'スターター',
              icon: '⭐',
              description: 'はじめての方向け',
              features_list: ['機能1', '機能2', '機能3'],
              price: '1,000円/月',
            },
            {
              title: 'プロフェッショナル',
              icon: '⭐⭐',
              description: '本格活用向け',
              features_list: ['全スターター機能', '機能4', '機能5'],
              price: '5,000円/月',
              recommended: true,
            },
            {
              title: 'エンタープライズ',
              icon: '⭐⭐⭐',
              description: '大規模利用向け',
              features_list: ['全プロフェッショナル機能', '機能6', 'サポート優先'],
              price: 'カスタム',
            },
          ],
          layout: 'card',
        },
      },
      {
        block_type: 'Comparison',
        sort_order: 2,
        data: {
          headline: 'vs 競合他社',
          comparison_table: [
            {
              feature: '料金',
              us: 'リーズナブル',
              competitor: '高額',
            },
            {
              feature: 'サポート',
              us: '24/7対応',
              competitor: 'メールのみ',
            },
            {
              feature: 'カスタマイズ',
              us: '完全対応',
              competitor: '限定的',
            },
          ],
        },
      },
      {
        block_type: 'FAQ',
        sort_order: 3,
        data: {
          headline: 'よくある質問',
          faqs: [
            {
              question: '契約期間の制約はありますか？',
              answer: 'いいえ。月単位で自由に変更・解除できます。',
            },
            {
              question: '途中でプラン変更はできますか？',
              answer: 'はい。いつでも変更可能です。',
            },
            {
              question: 'トライアル期間はありますか？',
              answer: '14日間の無料トライアルがあります。',
            },
          ],
        },
      },
      {
        block_type: 'CTA',
        sort_order: 4,
        data: {
          headline: 'あなたに合ったプランを選ぼう',
          description: '無料トライアルで体験できます',
          cta_text: 'はじめる',
          cta_url: '#signup',
          cta_type: 'primary',
        },
      },
    ],
  },
};

export function getTemplate(templateId) {
  return LP_TEMPLATES[templateId] || null;
}

export function listTemplates() {
  return Object.values(LP_TEMPLATES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    preview_color: t.preview_color,
  }));
}