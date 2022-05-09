function final = targetAI_cost_weights(file_name)

C = readlines(file_name);
total_lines = length(C);
trial_result_cell = {};
robot_results_cell = {};
origin = [0,0];
cost_object = zeros(1,4);


for i = 1:total_lines
    current_line = C(i);
    current_line_split = split(current_line);
    if current_line_split(1) == '"trial_num":'
        trial_num = double(current_line_split(2));
    elseif current_line_split(1) == '"robot_a_points":'
        x_positions = [];
        y_positions = [];
        robot_num = 1;
    elseif current_line_split(1) == '"robot_b_points":'
        x_positions = [];
        y_positions = [];
        robot_num = 2;
    elseif current_line_split(1) == '"x":'
        x_positions = [x_positions;double(current_line_split(2))];
        robot_results_cell{robot_num,1} = x_positions;
    elseif current_line_split(1) == '"y":'
        y_positions = [y_positions;double(current_line_split(2))];
        robot_results_cell{robot_num,2} = y_positions;
    elseif current_line_split(1) == '"duration":'
        time = double(current_line_split(2));
    elseif current_line_split(1) == '"response":'
        response = double(current_line_split(2));
        trial_result_cell{trial_num,1} = robot_results_cell;
        trial_result_cell{trial_num,2} = time;
        trial_result_cell{trial_num,3} = response;
    end
end

results_dim = size(trial_result_cell);
num_trials = results_dim(1);

for i = 1:num_trials

    response_t = trial_result_cell{i,2};
    response_val = trial_result_cell{i,3};


    %accuracy calculation
    a_x_mean = mean(trial_result_cell{i,1}{1,1});
    a_y_mean = mean(trial_result_cell{i,1}{1,2});
    a_mean = [a_x_mean,a_y_mean];
    a_accuracy = norm(a_mean-origin);
    b_x_mean = mean(trial_result_cell{i,1}{2,1});
    b_y_mean = mean(trial_result_cell{i,1}{2,2});
    b_mean = [b_x_mean,b_y_mean];
    b_accuracy = norm(b_mean-origin);
    accuracy_delta = abs((a_accuracy/b_accuracy)-(b_accuracy/a_accuracy));

    %accuracy squared calculation
    a_x_RMS_mean = rms(trial_result_cell{i,1}{1,1}.^2);
    a_y_RMS_mean = rms(trial_result_cell{i,1}{1,2}.^2);
    a_RMS_mean = [a_x_RMS_mean,a_y_RMS_mean];
    a_RMS_accuracy = norm(a_RMS_mean-origin);
    b_x_RMS_mean = rms(trial_result_cell{i,1}{2,1}.^2);
    b_y_RMS_mean = rms(trial_result_cell{i,1}{2,2}.^2);
    b_RMS_mean = [b_x_RMS_mean,b_y_RMS_mean];
    b_RMS_accuracy = norm(b_RMS_mean-origin);
    RMS_accuracy_delta = abs((a_RMS_accuracy/b_RMS_accuracy)-(b_RMS_accuracy/a_RMS_accuracy));

    %precision/squared precision calculation

    a_distances = [];
    b_distances = [];

    for j = 1:length(trial_result_cell{i,1}{1,1})
        a_working_point_x = trial_result_cell{i,1}{1,1}(j);
        a_working_point_y = trial_result_cell{i,1}{1,2}(j);
        a_working_point = [a_working_point_x,a_working_point_y];
        a_distance_from_mean = norm(a_working_point-a_mean);
        a_distances = [a_distances;a_distance_from_mean];

        b_working_point_x = trial_result_cell{i,1}{2,1}(j);
        b_working_point_y = trial_result_cell{i,1}{2,2}(j);
        b_working_point = [b_working_point_x,b_working_point_y];
        b_distance_from_mean = norm(b_working_point-b_mean);
        b_distances = [b_distances;b_distance_from_mean];
    end

    a_precision = mean(a_distances);
    a_RMS_precision = rms(a_distances.^2);
    b_precision = mean(b_distances);
    b_RMS_precision = rms(b_distances.^2);

    a_distances = [];
    b_distances = [];

    precision_delta = abs((a_precision/b_precision)-(b_precision/a_precision));
    RMS_precision_delta = abs((a_RMS_precision/b_RMS_precision)-(b_RMS_precision/a_RMS_precision));

    %cost object edit
    cost_object(1) = cost_object(1)+(accuracy_delta*abs(response_val)*(1/response_t));
    cost_object(2) = cost_object(2)+(RMS_accuracy_delta*abs(response_val)*(1/response_t));
    cost_object(3) = cost_object(3)+(precision_delta*abs(response_val)*(1/response_t));
    cost_object(4) = cost_object(4)+(RMS_precision_delta*abs(response_val)*(1/response_t));
end

%normalize for number of trials
cost_object = cost_object/num_trials;

headers = {'accuracy','RMS accuracy','precision','RMS precision'};

final = [headers;num2cell(cost_object)];
end