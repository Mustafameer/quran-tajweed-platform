/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, FolderTree, Bot, BookOpen, FileText, Check, Copy, Search } from 'lucide-react';
import { MYSQL_SCHEMA, PHP_MVC_STRUCTURE, TELEGRAM_BOT_PLAN, INSTALLATION_GUIDE, SOURCE_CODE_DOCS } from '../documentationData';

export default function DocsViewer() {
  const [activeTab, setActiveTab] = useState<'sql' | 'mvc' | 'bot' | 'install' | 'api'>('sql');
  const [copied, setCopied] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'sql', label: 'مخطط MySQL SQL', icon: Database, content: MYSQL_SCHEMA },
    { id: 'mvc', label: 'هيكلية PHP MVC', icon: FolderTree, content: PHP_MVC_STRUCTURE },
    { id: 'bot', label: 'خطة بوت تليجرام', icon: Bot, content: TELEGRAM_BOT_PLAN },
    { id: 'install', label: 'دليل التثبيت', icon: BookOpen, content: INSTALLATION_GUIDE },
    { id: 'api', label: 'توثيق الأكواد والـ API', icon: FileText, content: SOURCE_CODE_DOCS },
  ] as const;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const currentTab = tabs.find(t => t.id === activeTab)!;

  // Filter content lines if there is a search query
  const getFilteredContent = (text: string) => {
    if (!searchQuery) return text;
    const lines = text.split('\n');
    const matches = lines.filter(line => line.includes(searchQuery));
    if (matches.length === 0) return '--- لم يتم العثور على نتائج تطابق البحث ---';
    return `// نتائج البحث عن "${searchQuery}":\n\n` + matches.join('\n');
  };

  return (
    <div id="docs-viewer-container" className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col h-[650px] text-right" dir="rtl">
      {/* Header */}
      <div className="bg-emerald-800 p-6 text-white flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans">قسم مخرجات المشروع والتوثيق البرمجي</h2>
          <p className="text-emerald-100 text-sm mt-1 font-sans">
            قم بمعاينة ونسخ جميع ملفات قواعد البيانات وهيكلية PHP MVC المطلوبة لتشغيل النظام أو لبوت التليجرام.
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="بحث في الأكواد والملفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-emerald-900/50 text-white placeholder-emerald-300 text-sm rounded-lg px-4 py-2 pr-10 border border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-64 text-right"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-emerald-300" />
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50 p-2 gap-2 scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-emerald-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content pane */}
      <div className="flex-1 p-6 flex flex-col min-h-0 bg-slate-900 text-slate-100 font-mono text-sm leading-relaxed overflow-hidden relative">
        <div className="flex justify-between items-center mb-4 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400 font-mono font-bold">
            {currentTab.label} - {searchQuery ? 'نتائج مفلترة' : 'الملف الكامل'}
          </span>
          <button
            id="copy-doc-btn"
            onClick={() => handleCopy(currentTab.content, currentTab.id)}
            className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-all cursor-pointer"
          >
            {copied === currentTab.id ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-200 animate-pulse" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>نسخ الملف بالكامل</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto text-left ltr bg-slate-950 p-4 rounded-lg border border-slate-800 scrollbar-thin">
          <pre className="whitespace-pre overflow-x-auto font-mono text-xs md:text-sm text-emerald-400">
            {getFilteredContent(currentTab.content)}
          </pre>
        </div>
      </div>
    </div>
  );
}
