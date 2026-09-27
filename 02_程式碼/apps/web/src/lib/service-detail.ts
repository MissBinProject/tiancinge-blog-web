import type { Service } from '@tian-xin-ge/contracts';

export interface ServiceDetailSection {
  title: string;
  text: string;
}

/** Return only store-confirmed detail sections for the public service page. */
export function serviceDetailSections(service: Pick<Service, 'process' | 'suitableFor' | 'precautions' | 'faq'>): ServiceDetailSection[] {
  return [
    { title: '服務流程', text: service.process },
    { title: '適用情境', text: service.suitableFor },
    { title: '注意事項', text: service.precautions },
    { title: '常見問題', text: service.faq },
  ].filter((section): section is ServiceDetailSection => Boolean(section.text?.trim()));
}
