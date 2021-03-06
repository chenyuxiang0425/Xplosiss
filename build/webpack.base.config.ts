import * as path from 'path';
import * as webpack from 'webpack';
import * as fs from 'fs';
import { VueLoaderPlugin } from 'vue-loader';
import * as child_process from 'child_process';

import config from '../config';

const clientConfig = {
  title: config.title,
  subtitle: config.subtitle,
  avatar: config.avatar,
  url: config.url,
  footer: config.footer,
  api: {
    url: config.url + '/api'
  },
  components: config.components,
  meta: config.meta,
  plugins: config.plugins,
};

fs.writeFileSync(path.join(__dirname, '../src/config.json'), JSON.stringify(clientConfig));

let commit = null;
try {
  commit = child_process.execSync('git log -1 --format="%h"').toString().trim();
} catch (e) {
  commit = 'unknown';
}

const configuration: webpack.Configuration = {
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\.vue$/],
        }
      },
      {
        test: /\.pug$/,
        loader: 'pug-plain-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: [ '.js', '.ts' ]
  },
  performance: {
    hints: false
  },
  mode: 'development',
  devtool: '#eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.COMMIT': JSON.stringify(commit),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    new webpack.IgnorePlugin(/(server|\.md$)/, /plugins/),
    new VueLoaderPlugin(),
  ]
};

if (process.env.NODE_ENV === 'production') {
  // module.exports.devtool = '#source-map';
  configuration.plugins = (configuration.plugins || []).concat([
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new webpack.optimize.ModuleConcatenationPlugin()
  ]);
  configuration.mode = 'production';
}

export default configuration;
