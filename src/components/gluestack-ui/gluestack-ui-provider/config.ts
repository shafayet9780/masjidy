'use client';
import { vars } from 'nativewind';

import {
  gluestackNumberedScaleDark,
  gluestackNumberedScaleLight,
} from '@/theme/gluestack.config';

export const config = {
  light: vars(gluestackNumberedScaleLight),
  dark: vars(gluestackNumberedScaleDark),
};
