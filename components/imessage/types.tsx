export type MessageAuthor = 'me' | 'them';

export type Message = {
  id: string;
  author: MessageAuthor;
  text: string;
  timestamp: string; // e.g. '9:41 PM'
  showTimestampAbove?: boolean;
  showStatusBelow?: boolean;
};

