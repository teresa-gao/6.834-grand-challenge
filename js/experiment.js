var target_radius = 100;
var num_comparisons = 15;
var shots_per_target = 15;

var canvas_sidelength = 2*target_radius + 50;

function random_box_muller() {
  let v = 3;
  let r = 0;
  for (var i = v; i > 0; i --){
      r += Math.random();
  }
  return r / v * 2 * target_radius - target_radius;
}

var target_coords = [];
for (let target_num = 0; target_num < num_comparisons; target_num++) {
  let robot_a_points = [];
  let robot_b_points = [];

  for (let shot_num = 0; shot_num < shots_per_target; shot_num++) {
    let x1 = random_box_muller();
    let x2 = random_box_muller();
    let y1 = random_box_muller();
    let y2 = random_box_muller();

    robot_a_points.push({"x": x1, "y": y1});
    robot_b_points.push({"x": x2, "y": y2});
  }

  target_coords.push({
    "robot_a_points": robot_a_points,
    "robot_b_points": robot_b_points
  });
}

function draw_target(canvas) {
  canvas.setAttribute("height", "" + canvas_sidelength);
  canvas.setAttribute("width", "" + canvas_sidelength);
  let canvas_2d = canvas.getContext("2d");
  canvas_2d.beginPath();
  // red ring
  canvas_2d.arc(canvas_sidelength/2, canvas_sidelength/2, target_radius, 0, 2 * Math.PI);
  canvas_2d.fillStyle = "red";
  canvas_2d.fill();
  // white ring
  canvas_2d.beginPath();
  canvas_2d.arc(canvas_sidelength/2, canvas_sidelength/2, target_radius*0.8, 0, 2 * Math.PI);
  canvas_2d.fillStyle = "white";
  canvas_2d.fill();
  // red ring
  canvas_2d.beginPath();
  canvas_2d.arc(canvas_sidelength/2, canvas_sidelength/2, target_radius*0.6, 0, 2 * Math.PI);
  canvas_2d.fillStyle = "red";
  canvas_2d.fill();
  // white ring
  canvas_2d.beginPath();
  canvas_2d.arc(canvas_sidelength/2, canvas_sidelength/2, target_radius*0.4, 0, 2 * Math.PI);
  canvas_2d.fillStyle = "white";
  canvas_2d.fill();
  // white ring
  canvas_2d.beginPath();
  canvas_2d.arc(canvas_sidelength/2, canvas_sidelength/2, target_radius*0.2, 0, 2 * Math.PI);
  canvas_2d.fillStyle = "red";
  canvas_2d.fill();
}

function plot_shots(canvas, shots) {
  let canvas_2d = canvas.getContext("2d");
  let origin_coord = canvas_sidelength/2; // same for x and y since canvas is square
  for (var coords of shots) {
    let x = coords["x"] + origin_coord;
    let y = coords["y"] + origin_coord;
    canvas_2d.beginPath();
    canvas_2d.arc(x, y, 3, 0, 2 * Math.PI);
    canvas_2d.fillStyle = "black";
    canvas_2d.fill();
  }
}

function make_slides(f) {
  var slides = {};

  slides.i0 = slide({
     name : "i0",
     start: function() {
      exp.startT = Date.now();
     }
  });

  slides.instructions = slide({
    name : "instructions",
    button : function() {
      exp.go(); //use exp.go() if and only if there is no "present" data.
    }
  });

  slides.one_slider = slide({
    name : "one_slider",
    trial_num: 1, // counter to record trial number within block

    /* trial information for this block
     (the variable 'stim' will change between each of these values,
      and for each of these, present_handle will be run.) */
    present: target_coords, // defined at top of this file

    //this gets run only at the beginning of the block
    present_handle : function(stim) {
      $(".err").hide();
      this.stim = stim; //I like to store this information in the slide so I can record it later.
      this.startTime = Date.now();

      let robot_a_canvas = document.getElementById("robot_a");
      draw_target(robot_a_canvas);
      plot_shots(robot_a_canvas, stim["robot_a_points"])
      let robot_b_canvas = document.getElementById("robot_b");
      draw_target(robot_b_canvas);
      plot_shots(robot_b_canvas, stim["robot_b_points"])

      this.init_sliders();
      exp.sliderPost = null; //erase current slider value
    },

    button : function() {
      if (exp.sliderPost == null) {
        $(".err").show();
      } else {
        this.duration = (Date.now() - this.startTime) / 1000; // record time spent on trial
        this.log_responses();

        /* use _stream.apply(this); if and only if there is
        "present" data. (and only *after* responses are logged) */
        _stream.apply(this);
      }
    },

    init_sliders : function() {
      utils.make_slider("#single_slider", function(event, ui) {
        exp.sliderPost = ui.value;
      });
    },

    log_responses : function() {
      exp.data_trials.push({
        "trial_num": this.trial_num,
        "robot_a_points": this.stim["robot_a_points"],
        "robot_b_points": this.stim["robot_b_points"],
        "duration": this.duration,
        "response" : exp.sliderPost - 0.5
      });
      this.trial_num++
    }
  });

  slides.subj_info =  slide({
    name : "subj_info",
    submit : function(e){
      //if (e.preventDefault) e.preventDefault(); // I don't know what this means.
      exp.subj_data = {
        language : $("#language").val(),
        enjoyment : $("#enjoyment").val(),
        asses : $('input[name="assess"]:checked').val(),
        age : $("#age").val(),
        gender : $("#gender").val(),
        education : $("#education").val(),
        comments : $("#comments").val(),
        problems: $("#problems").val(),
        fairprice: $("#fairprice").val()
      };
      exp.go(); //use exp.go() if and only if there is no "present" data.
    }
  });

  slides.thanks = slide({
    name : "thanks",
    start : function() {
      exp.data= {
          "trials" : exp.data_trials,
          "subject_information" : exp.subj_data,
      };
      setTimeout(function() {turk.submit(exp.data);}, 1000);
    }
  });

  return slides;
}

/// init ///
function init() {

  //; support for uniqueturker
  // https://uniqueturker.myleott.com
  repeatWorker = false;
  (function(){
      var ut_id = "[INSERT uniqueTurkerID]";
      if (UTWorkerLimitReached(ut_id)) {
        $('.slide').empty();
        repeatWorker = true;
        alert("You have already completed the maximum number of HITs allowed by this requester. Please click 'Return HIT' to avoid any impact on your approval rating.");
      }
  })();

  exp.trials = [];
  exp.condition = _.sample(["CONDITION 1", "condition 2"]); //can randomize between subject conditions here

  //blocks of the experiment:
  exp.structure=[
    "i0",
    "instructions",
    "one_slider",
    "subj_info",
    "thanks"
  ];

  exp.data_trials = [];
  //make corresponding slides:
  exp.slides = make_slides(exp);

  exp.nQs = utils.get_exp_length(); //this does not work if there are stacks of stims (but does work for an experiment with this structure)
                    //relies on structure and slides being defined

  $('.slide').hide(); //hide everything

  //make sure turkers have accepted HIT (or you're not in mturk)
  $("#start_button").click(function() {
    if (turk.previewMode) {
      $("#mustaccept").show();
    } else {
      $("#start_button").click(function() {$("#mustaccept").show();});
      exp.go();
    }
  });

  exp.go(); //show first slide
}
