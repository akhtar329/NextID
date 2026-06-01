// components/ui/RichTextEditor.tsx

"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Code,
  Highlighter,
  Palette,
  Minus,
  X,
  Image as ImageIcon,
  Type,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Copy,
  Code2,
  Eye as EyeIcon,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Types
export interface EditorSection {
  id: string;
  type: 'eligibility' | 'how_to_apply' | 'note' | 'custom';
  title: string;
  content: string;
  isVisible: boolean;
  order: number;
}

interface RichTextEditorProps {
  value: string | EditorSection[];
  onChange: (value: string | EditorSection[]) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
  showWordCount?: boolean;
  mode?: 'single' | 'multi-section';
}

type EditorView = 'visual' | 'html';

// TipTap Editor Command Type
type EditorCommand = {
  focus: () => EditorCommand;
  toggleBold: () => EditorCommand;
  toggleItalic: () => EditorCommand;
  toggleUnderline: () => EditorCommand;
  toggleStrike: () => EditorCommand;
  toggleHeading: (options: { level: 1 | 2 | 3 }) => EditorCommand;
  toggleBulletList: () => EditorCommand;
  toggleOrderedList: () => EditorCommand;
  setTextAlign: (align: string) => EditorCommand;
  setLink: (options: { href: string }) => EditorCommand;
  unsetLink: () => EditorCommand;
  setImage: (options: { src: string }) => EditorCommand;
  setHorizontalRule: () => EditorCommand;
  toggleBlockquote: () => EditorCommand;
  toggleCodeBlock: () => EditorCommand;
  setColor: (color: string) => EditorCommand;
  toggleHighlight: () => EditorCommand;
  undo: () => EditorCommand;
  redo: () => EditorCommand;
  clearNodes: () => EditorCommand;
  unsetAllMarks: () => EditorCommand;
  extendMarkRange: (mark: string) => EditorCommand;
  run: () => void;
};

type TipTapEditor = {
  chain: () => EditorCommand;
  isActive: (name: string, options?: Record<string, unknown>) => boolean;
  can: () => { undo: () => boolean; redo: () => boolean };
  getAttributes: (name: string) => Record<string, unknown>;
  getHTML: () => string;
  getText: () => string;
  commands: {
    setContent: (content: string) => void;
  };
};

// Colors
const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#808080', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080',
  '#FFA500', '#FF69B4', '#4B0082', '#00CED1', '#FFD700', '#98FB98', '#FFB6C1',
];

// Menu Button Component
const MenuButton = ({ 
  onClick, 
  active, 
  disabled, 
  children, 
  title 
}: { 
  onClick: () => void; 
  active?: boolean; 
  disabled?: boolean; 
  children: React.ReactNode; 
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      p-2 rounded-md transition-all duration-200
      ${disabled 
        ? 'opacity-50 cursor-not-allowed bg-gray-100' 
        : active 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
    `}
  >
    {children}
  </button>
);

// Toolbar Component
function Toolbar({ editor }: { editor: TipTapEditor | null }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href as string;
    const url = window.prompt('Enter URL (must start with http:// or https://):', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor.chain().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (/^https?:\/\//.test(url)) {
      editor.chain().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      alert('Please enter a valid URL starting with http:// or https://');
    }
  };

  const insertHorizontalRule = () => {
    editor.chain().setHorizontalRule().run();
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:', 'https://');
    if (url && url.trim()) {
      editor.chain().setImage({ src: url }).run();
    }
  };

  const uploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      editor.chain().setImage({ src: base64 }).run();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

 const isTextAlignActive = (align: string) => {
  return editor.isActive('textAlign', { align: align });
};

  return (
    <div className="bg-gray-50 border-b border-gray-300 p-1.5 flex flex-wrap gap-1 sticky top-0 z-10">
      {/* Text Formatting */}
      <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
        <MenuButton onClick={() => editor.chain().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
        <MenuButton onClick={() => editor.chain().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
        <MenuButton onClick={() => editor.chain().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
        <MenuButton onClick={() => editor.chain().setTextAlign('left').run()} active={isTextAlignActive('left')} title="Align Left">
          <AlignLeft className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().setTextAlign('center').run()} active={isTextAlignActive('center')} title="Align Center">
          <AlignCenter className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().setTextAlign('right').run()} active={isTextAlignActive('right')} title="Align Right">
          <AlignRight className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Links & Images */}
      <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
        <MenuButton onClick={addLink} active={editor.isActive('link')} title="Add Link">
          <LinkIcon className="w-4 h-4" />
        </MenuButton>
        {editor.isActive('link') && (
          <MenuButton onClick={() => editor.chain().unsetLink().run()} title="Remove Link">
            <Unlink className="w-4 h-4" />
          </MenuButton>
        )}
        <div className="relative">
          <MenuButton onClick={() => setShowImageUpload(!showImageUpload)} title="Add Image">
            <ImageIcon className="w-4 h-4" />
          </MenuButton>
          {showImageUpload && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-md shadow-lg z-20 w-48">
              <button onClick={addImage} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded mb-1">
                Insert image URL
              </button>
              <div className="relative">
                <input type="file" accept="image/*" onChange={uploadImage} className="absolute inset-0 opacity-0 cursor-pointer" id="image-upload" />
                <label htmlFor="image-upload" className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                  Upload from computer
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text Color & Highlight */}
      <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
        <div className="relative">
          <MenuButton onClick={() => setShowColorPicker(!showColorPicker)} active={showColorPicker} title="Text Color">
            <Palette className="w-4 h-4" />
          </MenuButton>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-md shadow-lg grid grid-cols-7 gap-1 z-20 w-48">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().setColor(color).run();
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <MenuButton onClick={() => editor.chain().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          <Highlighter className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Block Elements */}
      <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
        <MenuButton onClick={() => editor.chain().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <Code className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={insertHorizontalRule} title="Horizontal Line">
          <Minus className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 ml-auto">
        <MenuButton onClick={() => editor.chain().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
          <X className="w-4 h-4" />
        </MenuButton>
      </div>
    </div>
  );
}

// Visual Editor Component
function VisualEditor({ 
  content, 
  onChange, 
  placeholder,
  disabled,
  minHeight
}: { 
  content: string; 
  onChange: (html: string) => void; 
  placeholder: string;
  disabled: boolean;
  minHeight: number;
}) {
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const isFirstRender = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Strike,
      TextStyle,
      Color,
      Highlight,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline', target: '_blank' } }),
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'max-w-full h-auto rounded-lg my-2' } }),
      Placeholder.configure({ placeholder, showOnlyWhenEditable: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right'] }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      const text = editor.getText();
      setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
      setCharacterCount(text.replace(/\s/g, '').length);
    },
    editorProps: {
      attributes: {
        className: 'prose prose-sm max-w-none focus:outline-none p-4',
        style: `min-height: ${minHeight}px;`,
      },
    },
    editable: !disabled,
    immediatelyRender: false,
  });

  // Update content when external value changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
      } else {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="border border-gray-300 rounded-md p-4 bg-gray-50">Loading editor...</div>;
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <Toolbar editor={editor as unknown as TipTapEditor} />
      <div className="relative">
        <EditorContent editor={editor} />
        <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-500 border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="flex items-center gap-1"><Type size={12} /><span>{wordCount} words</span></div>
          <div className="w-px h-3 bg-gray-300"></div>
          <div>{characterCount} characters</div>
        </div>
      </div>
    </div>
  );
}

// HTML Editor Component
function HTMLEditor({ 
  content, 
  onChange, 
  placeholder,
  disabled,
  minHeight
}: { 
  content: string; 
  onChange: (html: string) => void; 
  placeholder: string;
  disabled: boolean;
  minHeight: number;
}) {
  const [htmlContent, setHtmlContent] = useState(content);
  const [wordCount, setWordCount] = useState(0);
  const isInternalUpdate = useRef(false);

  // Update word count from content
  const updateWordCount = useCallback((html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, []);

  // Handle external content change
  useEffect(() => {
    if (!isInternalUpdate.current && content !== htmlContent) {
      setHtmlContent(content);
      updateWordCount(content);
    }
    isInternalUpdate.current = false;
  }, [content, htmlContent, updateWordCount]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    isInternalUpdate.current = true;
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    onChange(newHtml);
    updateWordCount(newHtml);
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden relative">
      <div className="bg-gray-50 border-b border-gray-300 p-2">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Code2 className="w-3 h-3" />
          HTML Editor - Edit raw HTML code
        </span>
      </div>
      <textarea
        value={htmlContent}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full p-4 font-mono text-sm focus:outline-none resize-y"
        style={{ minHeight: `${minHeight}px` }}
      />
      <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-500 border border-gray-200 shadow-sm">
        {wordCount} words
      </div>
    </div>
  );
}

// Single Editor Component (with Visual/HTML toggle)
function SingleEditor({ 
  value, 
  onChange, 
  placeholder,
  minHeight,
  disabled
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string;
  minHeight: number;
  disabled: boolean;
}) {
  const [view, setView] = useState<EditorView>('visual');

  return (
    <div className="space-y-2">
      {/* View Toggle */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setView('visual')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            view === 'visual' 
              ? 'bg-white text-blue-600 border border-b-0 border-gray-300' 
              : 'bg-gray-50 text-gray-500 hover:text-gray-700'
          }`}
        >
          <EyeIcon className="w-4 h-4" />
          Visual Editor
        </button>
        <button
          type="button"
          onClick={() => setView('html')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            view === 'html' 
              ? 'bg-white text-blue-600 border border-b-0 border-gray-300' 
              : 'bg-gray-50 text-gray-500 hover:text-gray-700'
          }`}
        >
          <Code2 className="w-4 h-4" />
          HTML Editor
        </button>
      </div>

      {/* Editor Content */}
      {view === 'visual' ? (
        <VisualEditor
          content={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          minHeight={minHeight}
        />
      ) : (
        <HTMLEditor
          content={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          minHeight={minHeight}
        />
      )}
    </div>
  );
}

// Section Editor Component
function SectionEditor({ 
  sections, 
  onSectionsChange, 
  disabled,
  minHeight
}: { 
  sections: EditorSection[]; 
  onSectionsChange: (sections: EditorSection[]) => void; 
  disabled: boolean;
  minHeight: number;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));
  const [activeView, setActiveView] = useState<Record<string, EditorView>>({});

  const updateSection = (sectionId: string, updates: Partial<EditorSection>) => {
    const updated = sections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    );
    onSectionsChange(updated);
  };

  const deleteSection = (sectionId: string) => {
    const updated = sections.filter(s => s.id !== sectionId);
    onSectionsChange(updated);
  };

  const addSection = () => {
    const newSection: EditorSection = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      title: 'New Section',
      content: '<p>Add your content here...</p>',
      isVisible: true,
      order: sections.length,
    };
    onSectionsChange([...sections, newSection]);
    setExpandedSections(new Set([...expandedSections, newSection.id]));
  };

  const duplicateSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const newSection: EditorSection = {
        ...section,
        id: `${section.type}-${Date.now()}`,
        title: `${section.title} (Copy)`,
        order: sections.length,
      };
      onSectionsChange([...sections, newSection]);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleView = (sectionId: string, view: EditorView) => {
    setActiveView(prev => ({ ...prev, [sectionId]: view }));
  };

  const onDragEnd = (result: unknown) => {
    const { source, destination } = result as { source: { index: number }; destination: { index: number } | null };
    if (!destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    const reordered = items.map((item, idx) => ({ ...item, order: idx }));
    onSectionsChange(reordered);
  };

  const sectionIcons: Record<string, string> = {
    eligibility: '📋',
    how_to_apply: '📝',
    note: '📌',
    custom: '📄',
  };

  const defaultSections = ['eligibility', 'how_to_apply', 'note'];

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index} isDragDisabled={disabled}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                    >
                      {/* Section Header */}
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="text-lg">{sectionIcons[section.type] || '📄'}</span>
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            className="font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-auto"
                            disabled={disabled}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {/* View Toggle */}
                          <div className="flex mr-2 border rounded overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleView(section.id, 'visual')}
                              className={`p-1 px-2 text-xs ${
                                activeView[section.id] === 'html' 
                                  ? 'bg-gray-100 text-gray-500' 
                                  : 'bg-blue-600 text-white'
                              }`}
                              title="Visual Editor"
                            >
                              <EyeIcon className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleView(section.id, 'html')}
                              className={`p-1 px-2 text-xs ${
                                activeView[section.id] === 'html' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                              title="HTML Editor"
                            >
                              <Code2 className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateSection(section.id, { isVisible: !section.isVisible })}
                            className="p-1 text-gray-500 hover:text-gray-700 rounded"
                            title={section.isVisible ? 'Hide' : 'Show'}
                          >
                            {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateSection(section.id)}
                            className="p-1 text-gray-500 hover:text-gray-700 rounded"
                            title="Duplicate"
                            disabled={disabled}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {!defaultSections.includes(section.type) && (
                            <button
                              type="button"
                              onClick={() => deleteSection(section.id)}
                              className="p-1 text-red-500 hover:text-red-700 rounded"
                              title="Delete"
                              disabled={disabled}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleSection(section.id)}
                            className="p-1 text-gray-500 hover:text-gray-700 rounded"
                          >
                            {expandedSections.has(section.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Section Content */}
                      {expandedSections.has(section.id) && section.isVisible && (
                        <div className="p-4">
                          {activeView[section.id] === 'html' ? (
                            <HTMLEditor
                              content={section.content}
                              onChange={(html) => updateSection(section.id, { content: html })}
                              placeholder={`Write HTML for ${section.title}...`}
                              disabled={disabled}
                              minHeight={minHeight}
                            />
                          ) : (
                            <VisualEditor
                              content={section.content}
                              onChange={(html) => updateSection(section.id, { content: html })}
                              placeholder={`Write content for ${section.title}...`}
                              disabled={disabled}
                              minHeight={minHeight}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Section Button */}
      {!disabled && (
        <button
          type="button"
          onClick={addSection}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Section
        </button>
      )}
    </div>
  );
}

// Helper: Get default sections
const getDefaultSections = (): EditorSection[] => [
  {
    id: 'eligibility-1',
    type: 'eligibility',
    title: 'Eligibility Criteria',
    content: '<p><strong>Minimum Requirements:</strong></p><ul><li>16 years of education</li><li>Minimum 60% marks</li></ul>',
    isVisible: true,
    order: 0,
  },
  {
    id: 'how-to-apply-1',
    type: 'how_to_apply',
    title: 'How to Apply',
    content: '<ol><li>Visit official website</li><li>Fill online application</li><li>Pay application fee</li></ol>',
    isVisible: true,
    order: 1,
  },
  {
    id: 'note-1',
    type: 'note',
    title: 'Additional Notes',
    content: '<p>Important information about selection process...</p>',
    isVisible: true,
    order: 2,
  },
];

// Main Component
export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Write something...",
  minHeight = 200,
  disabled = false,
  mode = 'single',
}: RichTextEditorProps) {
  
  // Handle sections initialization
  const [sections, setSections] = useState<EditorSection[]>(() => {
    if (mode === 'multi-section' && Array.isArray(value) && value.length > 0) {
      return value;
    }
    if (mode === 'multi-section') {
      return getDefaultSections();
    }
    return [];
  });

  // Handle multi-section changes
  const handleSectionsChange = useCallback((newSections: EditorSection[]) => {
    setSections(newSections);
    onChange(newSections);
  }, [onChange]);

  if (mode === 'multi-section') {
    return (
      <SectionEditor
        sections={sections}
        onSectionsChange={handleSectionsChange}
        disabled={disabled}
        minHeight={minHeight}
      />
    );
  }

  // Single mode
  return (
    <SingleEditor
      value={typeof value === 'string' ? value : ''}
      onChange={(html) => onChange(html)}
      placeholder={placeholder}
      minHeight={minHeight}
      disabled={disabled}
    />
  );
}

// Export helper functions
export const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};