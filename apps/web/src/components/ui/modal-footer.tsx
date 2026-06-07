import React, { ReactNode } from 'react';

type Props = {
  children?: ReactNode;
  className?: string;
};

export function ModalFooter({ children, className }: Props) {
  return <div className={`mt-4 text-right ${className ?? ''}`}>{children}</div>;
}

export default ModalFooter;
