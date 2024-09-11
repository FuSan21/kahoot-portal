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
-- Insert World Geography Quiz into quiz_sets table
INSERT INTO public.quiz_sets (id, name, description, image)
VALUES (
    'd75b8c7e-bfd3-4f47-8e90-bc3c3f3a9b6f',
    'World Geography Quiz',
    'A quiz to test your knowledge of world geography',
    'featured.webp'
  );
SELECT add_question (
    quiz_set_id => 'd75b8c7e-bfd3-4f47-8e90-bc3c3f3a9b6f'::uuid,
    body => 'Which is the largest desert in the world?'::text,
    "image" => '0.jpg'::text,
    "order" => 0,
    choices => array [
      '{"body": "Sahara", "is_correct": false}'::json,
      '{"body": "Antarctic Desert", "is_correct": true}'::json,
      '{"body": "Arabian Desert", "is_correct": false}'::json,
      '{"body": "Gobi Desert", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'd75b8c7e-bfd3-4f47-8e90-bc3c3f3a9b6f'::uuid,
    body => 'Which river is the longest in the world?'::text,
    "image" => '1.webp'::text,
    "order" => 1,
    choices => array [
      '{"body": "Amazon River", "is_correct": false}'::json,
      '{"body": "Nile River", "is_correct": true}'::json,
      '{"body": "Yangtze River", "is_correct": false}'::json,
      '{"body": "Mississippi River", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'd75b8c7e-bfd3-4f47-8e90-bc3c3f3a9b6f'::uuid,
    body => 'Which country has the most natural lakes?'::text,
    "image" => '2.webp'::text,
    "order" => 2,
    choices => array [
      '{"body": "Canada", "is_correct": true}'::json,
      '{"body": "Russia", "is_correct": false}'::json,
      '{"body": "Brazil", "is_correct": false}'::json,
      '{"body": "United States", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'd75b8c7e-bfd3-4f47-8e90-bc3c3f3a9b6f'::uuid,
    body => 'Which is the highest mountain in the world?'::text,
    "image" => '3.webp'::text,
    "order" => 3,
    choices => array [
      '{"body": "Mount Everest", "is_correct": true}'::json,
      '{"body": "K2", "is_correct": false}'::json,
      '{"body": "Kangchenjunga", "is_correct": false}'::json,
      '{"body": "Lhotse", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'd75b8c7e-bfd3-4f47-8e90-bc3c3f3a9b6f'::uuid,
    body => 'What is the capital of Australia?'::text,
    "image" => '4.webp'::text,
    "order" => 4,
    choices => array [
      '{"body": "Sydney", "is_correct": false}'::json,
      '{"body": "Melbourne", "is_correct": false}'::json,
      '{"body": "Canberra", "is_correct": true}'::json,
      '{"body": "Brisbane", "is_correct": false}'::json
    ]
  );
-- Insert General Science Quiz into quiz_sets table
INSERT INTO public.quiz_sets (id, name, description, image)
VALUES (
    'e85b9d7f-c1d3-49a6-bdf3-5a0cfe1d13b0',
    'General Science Quiz',
    'Test your knowledge of general science',
    'featured.png'
  );
SELECT add_question (
    quiz_set_id => 'e85b9d7f-c1d3-49a6-bdf3-5a0cfe1d13b0'::uuid,
    body => 'What is the chemical symbol for water?'::text,
    "image" => '0.jpg'::text,
    "order" => 0,
    choices => array [
      '{"body": "H2O", "is_correct": true}'::json,
      '{"body": "O2", "is_correct": false}'::json,
      '{"body": "CO2", "is_correct": false}'::json,
      '{"body": "NaCl", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'e85b9d7f-c1d3-49a6-bdf3-5a0cfe1d13b0'::uuid,
    body => 'Which planet is known as the Red Planet?'::text,
    "image" => '1.webp'::text,
    "order" => 1,
    choices => array [
      '{"body": "Mars", "is_correct": true}'::json,
      '{"body": "Venus", "is_correct": false}'::json,
      '{"body": "Earth", "is_correct": false}'::json,
      '{"body": "Jupiter", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'e85b9d7f-c1d3-49a6-bdf3-5a0cfe1d13b0'::uuid,
    body => 'What gas do plants absorb from the atmosphere?'::text,
    "image" => '2.webp'::text,
    "order" => 2,
    choices => array [
      '{"body": "Carbon dioxide", "is_correct": true}'::json,
      '{"body": "Oxygen", "is_correct": false}'::json,
      '{"body": "Nitrogen", "is_correct": false}'::json,
      '{"body": "Hydrogen", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'e85b9d7f-c1d3-49a6-bdf3-5a0cfe1d13b0'::uuid,
    body => 'What is the speed of light?'::text,
    "image" => '3.jpg'::text,
    "order" => 3,
    choices => array [
      '{"body": "299,792,458 meters per second", "is_correct": true}'::json,
      '{"body": "150,000,000 meters per second", "is_correct": false}'::json,
      '{"body": "1,080,000 kilometers per hour", "is_correct": false}'::json,
      '{"body": "670,616,629 miles per hour", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'e85b9d7f-c1d3-49a6-bdf3-5a0cfe1d13b0'::uuid,
    body => 'What is the powerhouse of the cell?'::text,
    "image" => '4.jpg'::text,
    "order" => 4,
    choices => array [
      '{"body": "Mitochondria", "is_correct": true}'::json,
      '{"body": "Nucleus", "is_correct": false}'::json,
      '{"body": "Ribosome", "is_correct": false}'::json,
      '{"body": "Endoplasmic Reticulum", "is_correct": false}'::json
    ]
  );
-- Insert Sports Trivia Quiz into quiz_sets table
INSERT INTO public.quiz_sets (id, name, description, image)
VALUES (
    'f93c9d7a-ecd1-44c7-9c91-94f7c93a7e63',
    'Sports Trivia Quiz',
    'A quiz to test your sports knowledge',
    'featured.webp'
  );
SELECT add_question (
    quiz_set_id => 'f93c9d7a-ecd1-44c7-9c91-94f7c93a7e63'::uuid,
    body => 'Which country won the FIFA World Cup in 2018?'::text,
    "image" => '0.webp'::text,
    "order" => 0,
    choices => array [
      '{"body": "France", "is_correct": true}'::json,
      '{"body": "Brazil", "is_correct": false}'::json,
      '{"body": "Germany", "is_correct": false}'::json,
      '{"body": "Argentina", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'f93c9d7a-ecd1-44c7-9c91-94f7c93a7e63'::uuid,
    body => 'Which athlete has won the most Olympic medals?'::text,
    "image" => '1.jpg'::text,
    "order" => 1,
    choices => array [
      '{"body": "Michael Phelps", "is_correct": true}'::json,
      '{"body": "Usain Bolt", "is_correct": false}'::json,
      '{"body": "Carl Lewis", "is_correct": false}'::json,
      '{"body": "Larisa Latynina", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'f93c9d7a-ecd1-44c7-9c91-94f7c93a7e63'::uuid,
    body => 'What sport is known as "the beautiful game"?'::text,
    "image" => '2.jpg'::text,
    "order" => 2,
    choices => array [
      '{"body": "Soccer", "is_correct": true}'::json,
      '{"body": "Basketball", "is_correct": false}'::json,
      '{"body": "Tennis", "is_correct": false}'::json,
      '{"body": "Cricket", "is_correct": false}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'f93c9d7a-ecd1-44c7-9c91-94f7c93a7e63'::uuid,
    body => 'Which tennis player has won the most Grand Slam titles?'::text,
    "image" => '3.png'::text,
    "order" => 3,
    choices => array [
      '{"body": "Serena Williams", "is_correct": false}'::json,
      '{"body": "Rafael Nadal", "is_correct": false}'::json,
      '{"body": "Roger Federer", "is_correct": false}'::json,
      '{"body": "Novak Djokovic", "is_correct": true}'::json
    ]
  );
SELECT add_question (
    quiz_set_id => 'f93c9d7a-ecd1-44c7-9c91-94f7c93a7e63'::uuid,
    body => 'What is the national sport of Japan?'::text,
    "image" => '4.jpg'::text,
    "order" => 4,
    choices => array [
      '{"body": "Sumo wrestling", "is_correct": true}'::json,
      '{"body": "Judo", "is_correct": false}'::json,
      '{"body": "Karate", "is_correct": false}'::json,
      '{"body": "Baseball", "is_correct": false}'::json
    ]
  );