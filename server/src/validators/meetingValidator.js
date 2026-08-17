const VALID_MEETING_TYPES = [
  'Client Meeting',
  'Sales Meeting',
  'Project Meeting',
  'Internal Meeting',
  'Requirement Discussion',
  'Retrospective',
  'Other'
];

const validateMeeting = (data, file) => {
  const { title, meetingDate, meetingType, transcript } = data;
  const errors = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Meeting title is required.');
  }

  if (!meetingDate || isNaN(Date.parse(meetingDate))) {
    errors.push('A valid meeting date is required.');
  }

  if (meetingType && !VALID_MEETING_TYPES.includes(meetingType)) {
    errors.push(`Invalid meeting type. Allowed types: ${VALID_MEETING_TYPES.join(', ')}`);
  }

  const hasTranscriptText = transcript && typeof transcript === 'string' && transcript.trim().length > 0;
  const hasFile = !!file;

  if (!hasTranscriptText && !hasFile) {
    errors.push('Meeting transcript is required. Please enter text or upload a .txt file.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  VALID_MEETING_TYPES,
  validateMeeting
};
