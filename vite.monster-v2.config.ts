import {defineConfig} from 'vite';
import base from './vite.config';

export default defineConfig({
 ...base,
 server:{hmr:false,watch:{ignored:['**/art-source/**','**/artifacts/**']}},
});
