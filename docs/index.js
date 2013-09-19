$(document).ready(function() {
  var $api = $('.api');
  var $start = $('.start');
  var $show = $('.left .show');
  var $hide = $('.left .hide');
  var width = $(window).width();
  var height = $(window).height();
  var THRESHOLD = 700;

  init();

  $(window).on('resize', function() {
    width = $(window).width();
    height = $(window).height();

    init();
  });

  var hash = window.location.hash;
  if (hash === '#start' && width < THRESHOLD) {
    hideAPI();
  }


  function init() {
    if (width < THRESHOLD) {
      $api.addClass('fullscreen');
      $start.addClass('full');
      $show.hide();
      $hide.hide();
    } else {
      $api.removeClass('fullscreen');
      $start.removeClass('full');
      $show.show();
      $hide.show();
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
      $hide.hide();
      $show.show();
    }
    $start.removeClass('hidden');
  }

  function showAPI() {
    $api.removeClass('hidden');
    if (width >= THRESHOLD) {
      $start.removeClass('full');
      $show.hide();
      $hide.show();
    }
    $start.addClass('hidden');
  }

  $('body').on('click', '.left', function() {
    if ($api.attr('class').indexOf('hidden') !== -1) {
      showAPI();
    } else if ($api.attr('class').indexOf('fullscreen') === -1) {
      // Now the headers are only links.
      console.log($api.attr('class'));
      hideAPI();
    }
  });
  $('body').on('click', '.right', function() {
    hideAPI();
  });
});
