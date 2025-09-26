
import { ApplicationStatus } from './types';

export const STATUS_OPTIONS = [
  ApplicationStatus.WISHLIST,
  ApplicationStatus.APPLIED,
  ApplicationStatus.INTERVIEWING,
  ApplicationStatus.OFFER,
  ApplicationStatus.REJECTED,
];

export const STATUS_COLORS: { [key in ApplicationStatus]: string } = {
  [ApplicationStatus.WISHLIST]: 'bg-blue-100 text-blue-800',
  [ApplicationStatus.APPLIED]: 'bg-indigo-100 text-indigo-800',
  [ApplicationStatus.INTERVIEWING]: 'bg-yellow-100 text-yellow-800',
  [ApplicationStatus.OFFER]: 'bg-green-100 text-green-800',
  [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800',
};
