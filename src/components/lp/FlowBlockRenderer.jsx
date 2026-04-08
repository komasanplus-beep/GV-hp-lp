/**
 * FlowBlockRenderer
 * Flow ブロックの公開側表示コンポーネント
 */

import React from 'react';

export default function FlowBlockRenderer({ data = {} }) {
  const { title, steps = [] } = data;

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* タイトル */}
        {title && (
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
            {title}
          </h2>
        )}

        {/* ステップフロー */}
        <div className="relative">
          {/* 接続線 */}
          {steps.length > 1 && (
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-amber-100 transform -translate-x-1/2 hidden md:block" />
          )}

          {/* ステップ一覧 */}
          <div className="space-y-8 relative z-10">
            {steps.map((step, index) => (
              <div key={step.id || index} className="flex gap-6 items-start">
                {/* ステップ番号 */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block w-1 h-12 bg-gradient-to-b from-amber-300 to-amber-100 mt-2" />
                  )}
                </div>

                {/* コンテンツ */}
                <div className="flex-1 pt-1">
                  {step.heading && (
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      {step.heading}
                    </h3>
                  )}
                  {step.description && (
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}