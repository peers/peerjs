$(document).ready(function() {
  var $api = $('.api');
  var $start = $('.start');
  var $show = $('.api .show');
  var $hide = $('.api .hide');
  var width = $(window).width();
  var height = $(window).height();
  var THRESHOLD = 700;

  init();

  $(window).on('resize', function() {
    width = $(window).width();
    height = $(window).height();

    init();
  });

  function init() {
    if (width < THRESHOLD) {
      $api.addClass('fullscreen');
      $start.addClass('full');
    } else {
      $api.removeClass('fullscreen');
      $start.removeClass('full');
    }

    if ($api.attr('class').indexOf('hidden') === -1) {
      showAPI();
    } else {
      hideAPI();
    }
  }

  function hideAPI() {
    $api.addClass('hidden');
    if (width >= THRESHOLD) {
      $start.addClass('full');
    }
    $start.removeClass('hidden');
    $hide.hide();
    $show.show();
  }

  function showAPI() {
    $api.removeClass('hidden');
    if (width >= THRESHOLD) {
      $start.removeClass('full');
    }
    $start.addClass('hidden');
    $show.hide();
    $hide.show();
  }

  $('body').on('click', '.hide', function() {
    hideAPI();
  });
  $('body').on('click', '.hidden', function() {
    showAPI();
  });
});
