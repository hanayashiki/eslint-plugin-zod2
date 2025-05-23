import exportZodType from './rules/export-zod-type.js';
import * as pkgJson from '../package.json';

export default {
  meta: {
    name: pkgJson.name,
    version: pkgJson.version,
  },
  rules: {
    'export-zod-type': exportZodType,
  },
};
