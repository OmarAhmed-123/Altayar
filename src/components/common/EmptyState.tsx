/**
 * EmptyState Component (Legacy)
 * This component now uses ExpressiveEmptyState internally for consistency
 */
import React from 'react';
import { ExpressiveEmptyState } from './ExpressiveEmptyState';

interface EmptyStateProps {
  title: string;
  message?: string;
  imageUrl?: string;
  imageCategory?: string;
  showAnimation?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = (props) => {
  // Map old category names to new ones
  const categoryMap: Record<string, string> = {
    'package': 'package',
    'search': 'search-empty',
    'booking': 'booking',
    'trip': 'trip',
    'review': 'review',
    'notification': 'notification',
    'empty': 'empty',
  };

  const mappedCategory = props.imageCategory 
    ? (categoryMap[props.imageCategory] || props.imageCategory)
    : 'empty';

  return (
    <ExpressiveEmptyState
      title={props.title}
      message={props.message}
      imageUrl={props.imageUrl}
      imageCategory={mappedCategory}
      showAnimation={props.showAnimation}
    />
  );
};

