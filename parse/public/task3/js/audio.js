$(function() {
  Audio.init();
});

var Audio = {
  dragEnterCount: 0,

  dragLeaveCount: 0,

  els: {},

  init: function() {

    Audio.els = {
      $input: $('.upload__input'),
      $body: $('body'),
      $dragzone: $('.dropzone'),
//      $audio: $('.audio__element'),
      $audio_name: $('.audio__name'),
      $audio_start: $('.audio__start'),
      $audio_stop: $('.audio__stop'),
      $spectrum: $('.spectrum'),
      $eq: $('.eq')
    };

    //fix browser vender for AudioContext and requestAnimationFrame
    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
    try {
      this.audioContext = new AudioContext();

      var eq = Equalizer.get(this.audioContext, Audio.els.$eq);

      Audio.viz.spectrum = Spectrum.get(this.audioContext, Audio.els.$spectrum[0]);
      var analyzer = Audio.viz.spectrum.load();
      this.connector = eq[0]; // Сначала подключаем фильтры, потом подключаем визуализатор, потом выходной
      eq[1].connect(analyzer);
      analyzer.connect(this.audioContext.destination);
    } catch (e) {
      this.noContext = true;
      console.error(e);
    }

    Audio.els.$input.on('change', Audio.load);

    var body = Audio.els.$body;
    body.on('dragenter', Audio.dragenter);
    body.on('dragleave', Audio.dragleave);
    body.on('dragover', Audio.dragover);
    body.on('drop', Audio.drop);

    Audio.els.$audio_start.click(this.start.bind(this));
    Audio.els.$audio_stop.click(this.stop.bind(this));
  },

  viz: {
    spectrum: null
  },

  dragleave: function(e) {
//    console.log('leave', Audio.dragLeaveCount);
    Audio.dragLeaveCount++;
    if (Audio.dragLeaveCount === Audio.dragEnterCount) {
      Audio.els.$dragzone.hide();
    }
    e.stopPropagation();
    e.preventDefault();
  },

  dragenter: function(e) {
//    console.log('enter', Audio.dragEnterCount);
    Audio.dragEnterCount++;
    Audio.els.$dragzone.show();
    e.stopPropagation();
    e.preventDefault();
  },

  dragover: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  drop: function(e) {
    e.stopPropagation();
    e.preventDefault();
    Audio.dragEnterCount = 0;
    Audio.dragLeaveCount = 0;
    Audio.els.$dragzone.hide();
    var file = e.originalEvent.dataTransfer.files[0];
    Audio.changeFile(file);
  },

  start: function() {
    var _this = this;
    if (this.buffer) {
      this.stop();
      this.source = this.audioContext.createBufferSource();
      this.source.connect(this.connector);
      this.source.buffer = this.buffer;
      _this.viz.spectrum.start();
      this.source.start(0);
      this.source.onended = function() {
        _this.viz.spectrum.stop();
      }
    }
  },

  stop: function() {
    if (this.source) {
      this.source.stop(0);
      delete this.source;
    }
  },

  changeFile: function(file) {
    var _this = this;
    var fr = new FileReader();
    var ctx = this.audioContext;
    fr.onload = function(e) {
      var fileResult = e.target.result;
      ctx.decodeAudioData(fileResult, function(buffer) {
        _this.buffer = buffer;
        _this.start();
      }, function(e) {
        console.error('Fail to decode file', e);
      });
    };
    fr.onerror = function(e) {
      console.error('Fail to read file', e);
    };
    fr.readAsArrayBuffer(file);



//    var url = URL.createObjectURL(file);
//    var aa = Audio.els.$audio[0];
//    aa.src = url;
//    aa.play();

    Audio.els.$audio_name.text(file.name);

    if (!this.noContext) {
      Audio.viz.spectrum.update();
    }
  },

  load: function() {
    var input = Audio.els.$input;
    var file = input[0].files[0];
    Audio.changeFile(file);
  }
};