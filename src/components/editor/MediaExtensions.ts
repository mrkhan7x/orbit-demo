import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VoiceMemoNode as VoiceMemoComponent } from './VoiceMemoNode';

export const AudioNode = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['audio', mergeAttributes(HTMLAttributes, { controls: 'true', class: 'w-full max-w-md my-4 rounded-xl border border-[var(--border)]' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VoiceMemoComponent);
  },
});

export const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', class: 'w-full max-w-2xl my-4 rounded-xl border border-[var(--border)] shadow-lg' })];
  },
});

export const IframeNode = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(HTMLAttributes, { class: 'w-full max-w-2xl aspect-video my-4 rounded-xl border border-[var(--border)] shadow-lg', allowfullscreen: 'true' })];
  },
});
