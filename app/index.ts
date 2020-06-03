const express = require('express');
const expressWebSocket = require('express-ws');
const webSocketStream = require('websocket-stream/stream');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const server = express();

const rtspRequestHandle = (ws: any, req: any) => {
  const { url } = req.query;
  if (!url) return;
  const stream = webSocketStream(
    ws,
    { binary: true, browserBufferTimeout: 1000000 },
    { browserBufferTimeout: 1000000 },
  );

  const ffmpegCommand = ffmpeg(url)
    .inputOptions([
      '-rtsp_transport tcp',
      '-buffer_size 102400',
      '-analyzeduration 100000',
      '-max_delay 1000000',
      '-r 24',
    ])
    .on('start', () => {
      console.log(url, 'Stream started.');
    })
    .on('codecData', () => {
      console.log(url, 'Stream codecData.');
    })
    .on('progress', (progress: any) => {
      console.log(progress);
    })
    .on('error', (err: Error) => {
      console.log(url, 'An error occured: ', err.message);
      stream.end();
    })
    .on('end', () => {
      console.log(url, 'Stream end!');
      stream.end();
    })
    .outputFormat('flv')
    .videoCodec('copy')
    .noAudio();

  stream.on('close', () => {
    ffmpegCommand.kill('SIGKILL');
  });

  try {
    ffmpegCommand.pipe(stream);
  } catch (error) {
    console.log(error);
  }
};

expressWebSocket(server, null, {
  perMessageDeflate: true,
});

server.ws('/rtsp/:id/', rtspRequestHandle);

server.listen(8888);
