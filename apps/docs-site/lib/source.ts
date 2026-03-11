import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { createElement } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Book02Icon,
  BrowserIcon,
  SmartPhone01Icon,
  Database01Icon,
  Rocket01Icon,
  File01Icon,
} from '@hugeicons/core-free-icons';

const iconMap: Record<string, typeof Book02Icon> = {
  Book02Icon,
  BrowserIcon,
  SmartPhone01Icon,
  Database01Icon,
  Rocket01Icon,
  File01Icon,
};

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon || !(icon in iconMap)) return;
    return createElement(HugeiconsIcon, {
      icon: iconMap[icon],
      size: 16,
    });
  },
});
