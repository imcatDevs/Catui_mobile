import terser from '@rollup/plugin-terser';
import scss from 'rollup-plugin-scss';
import babel from '@rollup/plugin-babel';

const production = !process.env.ROLLUP_WATCH;

// 코어 번들 - CATUI Mobile
const coreConfig = {
  input: 'src/core/index.js',
  output: [
    {
      file: 'dist/catui-mobile.js',
      format: 'iife',
      name: 'CATUI',
      sourcemap: !production
    },
    {
      file: 'dist/catui-mobile.min.js',
      format: 'iife',
      name: 'CATUI',
      plugins: [terser()],
      sourcemap: production
    }
  ],
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

// 모듈 번들 함수 (각 모듈을 독립적으로 빌드)
function createModuleConfig(moduleName) {
  return {
    input: `src/modules/${moduleName}/${moduleName}.js`,
    output: {
      file: `dist/modules/${moduleName}/${moduleName}.js`,
      format: 'esm',
      sourcemap: !production
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
  // 모바일 우선 모듈 (향후 추가 예정)
  // 'swiper',
  // 'bottom-sheet',
  // 'action-sheet',
  // 'tabs-mobile',
  // 'infinite-scroll',
].filter(Boolean).map(createModuleConfig);

// 코어 + 모듈 빌드
export default [coreConfig, ...moduleConfigs];
