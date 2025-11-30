import terser from '@rollup/plugin-terser';
import scss from 'rollup-plugin-scss';
import babel from '@rollup/plugin-babel';

const production = !process.env.ROLLUP_WATCH;

// 코어 번들 - CATUI Mobile
// IIFE 빌드 후 default export 문제 해결 코드
const iifeFooter = `
;(function() {
  if (typeof window !== 'undefined' && window.CATUI && window.CATUI.default) {
    var d = window.CATUI.default;
    Object.keys(d).forEach(function(k) { window.CATUI[k] = d[k]; });
    var origCATUI = window.CATUI;
    window.CATUI = function(s) { return d(s); };
    Object.assign(window.CATUI, origCATUI);
    Object.keys(d).forEach(function(k) { window.CATUI[k] = d[k]; });
    window.IMCAT = window.CATUI;
  }
})();
`;

const coreConfig = {
  input: 'src/core/index.js',
  output: [
    {
      file: 'dist/catui-mobile.js',
      format: 'iife',
      name: 'CATUI',
      sourcemap: !production,
      footer: iifeFooter
    },
    {
      file: 'dist/catui-mobile.min.js',
      format: 'iife',
      name: 'CATUI',
      plugins: [terser()],
      sourcemap: production,
      footer: iifeFooter
    }
  ],
  // named export 경고 무시 (IIFE에서 window.CATUI로 접근)
  onwarn(warning, warn) {
    if (warning.code === 'MIXED_EXPORTS') return;
    warn(warning);
  },
  plugins: [
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          targets: {
            // 모바일 브라우저 타겟
            chrome: '90',
            firefox: '88',
            safari: '14',
            edge: '90',
            ios: '14',
            android: '90'
          },
          modules: false
        }]
      ]
    }),
    scss({
      output: production ? 'dist/catui-mobile.min.css' : 'dist/catui-mobile.css',
      outputStyle: production ? 'compressed' : 'expanded',
      sourceMap: !production
    })
  ]
};

// 모듈 번들 함수 (ESM만 빌드)
function createModuleConfig(moduleName) {
  return {
    input: `src/modules/${moduleName}/${moduleName}.js`,
    output: {
      file: `dist/modules/${moduleName}/${moduleName}.js`,
      format: 'esm',
      sourcemap: !production
    },
    onwarn(warning, warn) {
      if (warning.code === 'MIXED_EXPORTS') return;
      warn(warning);
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      }),
      production && terser()
    ].filter(Boolean)
  };
}

// 모바일 전용 모듈 리스트
const moduleConfigs = [
  // 기본 모듈
  'theme',
  'overlays',
  'navigation',
  'pickers',
  'selectors',
  'forms',
  'feedback',
  'carousel',
  'pagination',
  'scroll',
  'social',
  'wordcloud',
].filter(Boolean).map(createModuleConfig);

// 코어 + 모듈 빌드
export default [coreConfig, ...moduleConfigs];
