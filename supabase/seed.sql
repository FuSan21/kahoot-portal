-- Insert Bangladesh History Quiz into quiz_sets table
INSERT INTO public.quiz_sets (id, name, description, image)
VALUES (
    'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f',
    'Bangladesh History Quiz',
    'A quiz to test your knowledge of Bangladesh history',
    'featured.png'
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'When did Bangladesh gain independence?'::text,
    "image" => '0.jpg'::text,
    "order" => 0,
    choices => array [
      '{"body": "1971", "is_correct": true}'::json,
      '{"body": "1947", "is_correct": false}'::json,
      '{"body": "1952", "is_correct": false}'::json,
      '{"body": "1991", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'Which event is commemorated on Victory Day in Bangladesh?'::text,
    "image" => '1.jpg'::text,
    "order" => 1,
    choices => array [
      '{"body": "The surrender of the Pakistani army in 1971.", "is_correct": true}'::json,
      '{"body": "The end of British rule in 1947.", "is_correct": false}'::json,
      '{"body": "The signing of the 1952 Language Movement treaty.", "is_correct": false}'::json,
      '{"body": "The formation of the Awami League.", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'What was the name of the movement in 1952 that played a significant role in the Bengali Language Movement?'::text,
    "image" => '2.jpg'::text,
    "order" => 2,
    choices => array [
      '{"body": "Language Movement", "is_correct": true}'::json,
      '{"body": "Independence Movement", "is_correct": false}'::json,
      '{"body": "Freedom Movement", "is_correct": false}'::json,
      '{"body": "Cultural Movement", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'What was the original name of Dhaka when it was first established?'::text,
    "image" => '3.jpg'::text,
    "order" => 3,
    choices => array [
      '{"body": "Jahangir Nagar", "is_correct": true}'::json,
      '{"body": "Sonargaon", "is_correct": false}'::json,
      '{"body": "Lalbagh", "is_correct": false}'::json,
      '{"body": "Narsingdi", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'Which river is known as the lifeline of Bangladesh?'::text,
    "image" => '4.jpg'::text,
    "order" => 4,
    choices => array [
      '{"body": "Padma", "is_correct": true}'::json,
      '{"body": "Jamuna", "is_correct": false}'::json,
      '{"body": "Meghna", "is_correct": false}'::json,
      '{"body": "Karnaphuli", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'Which Mughal emperor founded the city of Dhaka?'::text,
    "image" => '5.png'::text,
    "order" => 5,
    choices => array [
      '{"body": "Jahangir", "is_correct": true}'::json,
      '{"body": "Akbar", "is_correct": false}'::json,
      '{"body": "Shah Jahan", "is_correct": false}'::json,
      '{"body": "Aurangzeb", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'Who was the first Prime Minister of Bangladesh?'::text,
    "image" => '6.webp'::text,
    "order" => 6,
    choices => array [
      '{"body": "Tajuddin Ahmad", "is_correct": true}'::json,
      '{"body": "Sheikh Mujibur Rahman", "is_correct": false}'::json,
      '{"body": "Ziaur Rahman", "is_correct": false}'::json,
      '{"body": "M. A. G. Osmani", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'Which city was the first capital of Bangladesh after independence?'::text,
    "image" => '7.png'::text,
    "order" => 7,
    choices => array [
      '{"body": "Dhaka", "is_correct": true}'::json,
      '{"body": "Chittagong", "is_correct": false}'::json,
      '{"body": "Khulna", "is_correct": false}'::json,
      '{"body": "Comilla", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'What is the national flower of Bangladesh?'::text,
    "image" => '8.jpg'::text,
    "order" => 8,
    choices => array [
      '{"body": "Water Lily", "is_correct": true}'::json,
      '{"body": "Rose", "is_correct": false}'::json,
      '{"body": "Marigold", "is_correct": false}'::json,
      '{"body": "Sunflower", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'c74f5d8c-a2d3-4b47-9b90-ec4c1e8f3b9f'::uuid,
    body => 'Which treaty officially recognized Bangladesh as an independent country by Pakistan?'::text,
    "image" => '9.png'::text,
    "order" => 9,
    choices => array [
      '{"body": "The Simla Agreement", "is_correct": false}'::json,
      '{"body": "The Delhi Accord", "is_correct": false}'::json,
      '{"body": "The Indo-Bangladesh Treaty", "is_correct": false}'::json,
      '{"body": "The Instrument of Surrender", "is_correct": true}'::json
    ]
  );