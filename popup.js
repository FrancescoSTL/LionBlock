// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// document.write("sup"); 
function showOptions() {
  document.getElementById('options').style.visibility='hidden';
}

$("#click-tag").on('click', function(event){
    //document.getElementById('options').style.visibility='visible';
    $('.option-container').toggleClass('open');
});

$('.carousel').carousel('pause')