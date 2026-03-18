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
} from 'lucide-react';
import { useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
}

interface MenuButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

const MenuButton = ({ onClick, active, disabled, children, title }: MenuButtonProps) => (
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

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Write something...",
  minHeight = 200,
  maxHeight = 500,
  disabled = false
}: RichTextEditorProps) {
  
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Strike,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder,
        showOnlyWhenEditable: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-4 overflow-y-auto`,
        style: `min-height: ${minHeight}px; max-height: ${maxHeight}px;`,
      },
    },
    editable: !disabled,
    immediatelyRender: false,
  });

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL (must start with http:// or https://):', previousUrl);
    
    if (url === null) {
      return;
    }
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    if (/^https?:\/\//.test(url)) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      alert('Please enter a valid URL starting with http:// or https://');
    }
  };

  const insertHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#808080', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080',
  ];

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden ${disabled ? 'opacity-75' : ''}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-1.5 flex flex-wrap gap-1 sticky top-0 z-10">
        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            disabled={disabled}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            disabled={disabled}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            disabled={disabled}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            disabled={disabled}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            disabled={disabled}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            disabled={disabled}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            disabled={disabled}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            disabled={disabled}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            disabled={disabled}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            disabled={disabled}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            disabled={disabled}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            disabled={disabled}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Links */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
          <MenuButton
            onClick={addLink}
            active={editor.isActive('link')}
            disabled={disabled}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </MenuButton>

          {editor.isActive('link') && (
            <MenuButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              disabled={disabled}
              title="Remove Link"
            >
              <Unlink className="w-4 h-4" />
            </MenuButton>
          )}
        </div>

        {/* Text Color */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5 relative">
          <MenuButton
            onClick={() => setShowColorPicker(!showColorPicker)}
            active={showColorPicker}
            disabled={disabled}
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </MenuButton>
          
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-md shadow-lg grid grid-cols-7 gap-1 z-20">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColorPicker(false);
                  }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
          <MenuButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive('highlight')}
            disabled={disabled}
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Block Elements */}
        <div className="flex items-center gap-0.5 border-r border-gray-300 pr-1.5 mr-1.5">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            disabled={disabled}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            disabled={disabled}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={insertHorizontalRule}
            disabled={disabled}
            title="Horizontal Line"
          >
            <Minus className="w-4 h-4" />
          </MenuButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 ml-auto">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() || disabled}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() || disabled}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            disabled={disabled}
            title="Clear Formatting"
          >
            <X className="w-4 h-4" />
          </MenuButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}