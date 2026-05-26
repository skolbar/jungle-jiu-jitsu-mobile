import type { Content } from './types';

export type ContentModule = {
  description: string;
  lockedCount: number;
  requiredDegree: number;
  requiredBelt: Content['required_belt'];
  slug: string;
  title: string;
  totalCount: number;
  unlockedCount: number;
};

const MODULE_TITLES: Record<string, string> = {
  costas: 'Costas',
  geral: 'Conteudos Gerais',
  'guarda-aberta': 'Guarda Aberta',
  'guarda-fechada': 'Guarda Fechada',
  montada: 'Montada',
  'passagem-de-guarda': 'Passagem de Guarda',
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  costas: 'Controle e finalizacoes das costas',
  geral: 'Conteudos diversos e complementares',
  'guarda-aberta': 'Variacoes e tecnicas da guarda aberta',
  'guarda-fechada': 'Raspagens, passagens e finalizacoes da guarda fechada',
  montada: 'Controle e finalizacoes da posicao montada',
  'passagem-de-guarda': 'Tecnicas para passar a guarda',
};

export function getModuleSlug(content: Pick<Content, 'module_slug'>): string {
  return content.module_slug || 'geral';
}

export function formatModuleTitle(slug: string): string {
  return MODULE_TITLES[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getModuleDescription(slug: string): string {
  return MODULE_DESCRIPTIONS[slug] || 'Modulo de tecnicas de Jiu-Jitsu';
}

export function groupContentByModule(contents: Content[]): Record<string, Content[]> {
  return contents.reduce<Record<string, Content[]>>((acc, content) => {
    const slug = getModuleSlug(content);
    acc[slug] = acc[slug] ?? [];
    acc[slug].push(content);
    return acc;
  }, {});
}
