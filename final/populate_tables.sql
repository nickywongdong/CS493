DROP TABLE IF EXISTS `beers`;

-- Beers table --
CREATE TABLE beers (
    id int NOT NULL AUTO_INCREMENT,
    manufacturerid int NOT NULL,
    name VARCHAR(255) NOT NULL,
    abv real NOT NULL,
    ibu INT NOT NULL,
    calories int NOT NULL,
    type VARCHAR(255) NOT NULL,
    PRIMARY KEY(id),
    INDEX idx_manufacturerid (manufacturerid)
  );


-- Insert initial values into businesses table --
INSERT INTO beers (manufacturerid, name, abv, ibu, calories, type)
VALUES
('10', 'Pacifico', '5.4', '6', '146', 'Pilsner'),
('1', 'Fat Tire', '5.2', '22', '160', 'Belgian Style Ale'),
('2', 'VooDoo Ranger', '7.0', '50', '160', 'IPA'),
('3', 'Citradelic', '6', '50', '170', 'Tangerine IPA'),
('4', 'Juice Haze IPA', '7.2', '42', '230', 'IPA'),
('5', 'Coors Light', '4.2', '10', '102', 'Lager'),
('6', 'Guiness', '4.2', '45', '125', 'Stout'),
('7', 'Kiwanda', '5.4', '25', '125', 'Cream Ale'),
('8', 'Umbrella', '7.4', '60', '160', 'Pale Ale'),
('9', 'Tsunami', '7', '45', '170', 'stout');


DROP TABLE IF EXISTS `reviews`;

-- Reviews table --
CREATE TABLE reviews (
  id INT NOT NULL AUTO_INCREMENT,
  dollars INT NOT NULL,
  stars real NOT NULL,
  review VARCHAR(255),
  userid INT NOT NULL,
  beerid INT NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_beerid (beerid),
  FOREIGN KEY(beerid) REFERENCES beers(id) ON DELETE CASCADE
) ENGINE=INNODB;

INSERT INTO reviews(dollars, stars, review, userid, beerid)
values
('1', '4.5', 'Cheap, delicious beer.', '1', '10'),
('2', '3.5', '', '2', '1'),
('1', '3.5', 'Try the IPA.', '3', '2'),
('3', '4.5', 'Try the Pale Ale.', '4', '3'),
('3', '5', 'BEST BEER', '5', '4'),
('2', '3', 'Beer was okay', '6', '5'),
('2', '3.5', '', '7', '6'),
('3', '4.5', '', '8', '7'),
('1', '2.5', 'Bad Beer', '9', '8'),
('2', '3.5', '', '10', '9');

-- Drop Manufacturers table --
DROP TABLE IF EXISTS `manufacturers`;

-- Create manufacturers table --
CREATE TABLE manufacturers (
  id INT NOT NULL AUTO_INCREMENT,
  beerid INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  zip INT NOT NULL,
  phonenumber VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

-- Insert into manufacturers --
INSERT INTO manufacturers(beerid, name, city, state, zip, phonenumber)
values
('10', 'Heineken', 'Portland', 'Oregon', '97220', '5031234567'),
('2', 'Carlsberg', 'Bend', 'Oregon', '97001', '5033214567'),
('3', 'Asahi', 'Corvallis', 'Oregon', '97330', '5034444567'),
('4', 'Anheuser-Busch InBev', 'Eugene', 'Oregon', '97401', '5035554567'),
('5', 'China Resources Snow Breweries', 'Tigad', 'Oregon', '97224', '5036664567'),
('6', 'Molson Coors Brewing', 'Salem', 'Oregon', '97301', '5037774567'),
('7', 'Tsingtao Brewery Group', 'Tualatin', 'Oregon', '97305', '5038884567'),
('8', 'Yanjing', 'West Linn', 'Oregon', '97036', '5039994567'),
('9', 'Kirin', 'Vancouver', 'Washington', '98607', '5039999999');



