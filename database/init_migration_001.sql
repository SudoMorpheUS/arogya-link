CREATE TABLE patient (
  patient_id     VARCHAR(20)  PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  date_of_birth  DATE         NOT NULL,
  gender         CHAR(1)      NOT NULL CHECK (gender IN ('M', 'F', 'O')),
  blood_group    VARCHAR(5),
  contact_number VARCHAR(15)  NOT NULL,
  email          VARCHAR(100) UNIQUE
);


CREATE TABLE hospital (
  hospital_id     VARCHAR(15)  PRIMARY KEY,
  hospital_name   VARCHAR(150) NOT NULL,
  address         VARCHAR(255) NOT NULL,
  contact_number  VARCHAR(15)  NOT NULL,
  registration_no VARCHAR(30)  UNIQUE NOT NULL
);


CREATE TABLE doctor (
  doctor_id      VARCHAR(15)  PRIMARY KEY,
  hospital_id    VARCHAR(15)  NOT NULL REFERENCES hospital(hospital_id),
  full_name      VARCHAR(100) NOT NULL,
  specialization VARCHAR(80)  NOT NULL,
  license_number VARCHAR(30)  UNIQUE NOT NULL
);


CREATE TABLE visit (
  visit_id        SERIAL      PRIMARY KEY,
  patient_id      VARCHAR(20) NOT NULL REFERENCES patient(patient_id),
  hospital_id     VARCHAR(15) NOT NULL REFERENCES hospital(hospital_id),
  doctor_id       VARCHAR(15) NOT NULL REFERENCES doctor(doctor_id),
  visit_date      TIMESTAMP   NOT NULL DEFAULT NOW(),
  visit_type      VARCHAR(20) NOT NULL CHECK (visit_type IN ('OPD', 'Emergency', 'Inpatient')),
  chief_complaint VARCHAR(255)
);


CREATE TABLE diagnosis (
  diagnosis_id   SERIAL       PRIMARY KEY,
  visit_id       INTEGER      NOT NULL REFERENCES visit(visit_id) ON DELETE CASCADE,
  disease_code   VARCHAR(10)  NOT NULL,
  description    VARCHAR(255) NOT NULL,
  diagnosed_date DATE         NOT NULL
);


CREATE TABLE prescription (
  prescription_id SERIAL       PRIMARY KEY,
  visit_id        INTEGER      NOT NULL REFERENCES visit(visit_id) ON DELETE CASCADE,
  medicine_name   VARCHAR(100) NOT NULL,
  dosage          VARCHAR(50)  NOT NULL,
  frequency       VARCHAR(50)  NOT NULL,
  duration        VARCHAR(50)  NOT NULL
);


CREATE TABLE lab_test (
  lab_test_id SERIAL       PRIMARY KEY,
  visit_id    INTEGER      NOT NULL REFERENCES visit(visit_id) ON DELETE CASCADE,
  test_name   VARCHAR(100) NOT NULL,
  result      VARCHAR(100),
  unit        VARCHAR(30),
  test_date   DATE         NOT NULL
);

CREATE TABLE consent (
  consent_id  SERIAL      PRIMARY KEY,
  patient_id  VARCHAR(20) NOT NULL REFERENCES patient(patient_id),
  hospital_id VARCHAR(15) REFERENCES hospital(hospital_id),
  doctor_id   VARCHAR(15) REFERENCES doctor(doctor_id),
  start_date  DATE        NOT NULL,
  end_date    DATE,
  status      VARCHAR(15) NOT NULL CHECK (status IN ('Active', 'Revoked')),
  CHECK (hospital_id IS NOT NULL OR doctor_id IS NOT NULL),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE audit_log (
  log_id      SERIAL      PRIMARY KEY,
  patient_id  VARCHAR(20) NOT NULL REFERENCES patient(patient_id),
  doctor_id   VARCHAR(15) REFERENCES doctor(doctor_id),
  action      VARCHAR(30) NOT NULL,
  action_time TIMESTAMP   NOT NULL DEFAULT NOW(),
  details     TEXT
);