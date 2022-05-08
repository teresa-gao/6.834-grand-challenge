var target_radius = 100;
var num_comparisons = 25;
var shots_per_target = 15;

var target_coords = [];
for (let target_num = 0; target_num < num_comparisons; target_num++) {
  let robot_a_points = [];
  let robot_b_points = [];

  for (let shot_num = 0; shot_num < shots_per_target; shot_num++) {
    let x1 = Math.cos(Math.random()*Math.PI*2)*target_radius;
    let x2 = Math.cos(Math.random()*Math.PI*2)*target_radius;

    let y1 = Math.cos(Math.random()*Math.PI*2)*target_radius;
    let y2 = Math.cos(Math.random()*Math.PI*2)*target_radius;

    robot_a_points.push({"x": x1, "y": y1});
    robot_b_points.push({"x": x2, "y": y2});
  }

  target_coords.push({
    "robot_a_points": robot_a_points,
    "robot_b_points": robot_b_points
  });
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
      console.log(stim);

      $(".err").hide();
      this.stim = stim; //I like to store this information in the slide so I can record it later.
      this.startTime = Date.now();

      CanvasJS.addColorSet("black", ["#000000"]);
      let robot_a_plot = new CanvasJS.Chart("robot_a", {
      // let options = {
        colorSet: "black",
        axisX: {
          title:"",
          minimum: -1 * target_radius - 5,
          maximum: target_radius + 5,
          gridThickness: 0,
          tickThickness: 0,
          lineThickness: 0,
          labelFormatter: function(e) {
            return "";
          }
        },
        axisY:{
          title: "",
          minimum: -1 * target_radius - 5,
          maximum: target_radius + 5,
          gridThickness: 0,
          tickThickness: 0,
          lineThickness: 0,
          labelFormatter: function(e) {
            return "";
          }
        },
        data: [{
          type: "scatter",
          dataPoints: stim.robot_a_points
        }]
      });
      robot_a_plot.render();

      let robot_b_plot = new CanvasJS.Chart("robot_b", {
        colorSet: "black",
        axisX: {
          title:"",
          minimum: -1 * target_radius - 5,
          maximum: target_radius + 5,
          gridThickness: 0,
          tickThickness: 0,
          lineThickness: 0,
          labelFormatter: function(e) {
            return "";
          }
        },
        axisY:{
          title: "",
          minimum: -1 * target_radius - 5,
          maximum: target_radius + 5,
          gridThickness: 0,
          tickThickness: 0,
          lineThickness: 0,
          labelFormatter: function(e) {
            return "";
          }
        },
        data: [{
          type: "scatter",
          dataPoints: stim.robot_b_points
        }]
      });
      robot_b_plot.render();

      this.init_sliders();
      exp.sliderPost = null; //erase current slider value
    },

    button : function() {
      if (exp.sliderPost == null) {
        $(".err").show();
      } else {
        this.RT = (Date.now() - this.startTime) / 1000; // record time spent on trial
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
        "trial_type" : "one_slider",
        "trial_num": this.trial_num,
        "RT": this.RT,
        "subject": this.stim.subject,
        "object": this.stim.object,
        "response" : exp.sliderPost
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
          "system" : exp.system,
          "condition" : exp.condition,
          "subject_information" : exp.subj_data,
          "time_in_minutes" : (Date.now() - exp.startT)/60000
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
  exp.system = {
      Browser : BrowserDetect.browser,
      OS : BrowserDetect.OS,
      screenH: screen.height,
      screenUH: exp.height,
      screenW: screen.width,
      screenUW: exp.width
    };

  //blocks of the experiment:
  exp.structure=[
    // TODO: uncomment!
    // "i0",
    // "instructions",
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
