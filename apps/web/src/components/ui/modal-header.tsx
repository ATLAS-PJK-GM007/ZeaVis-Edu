import React, { ReactNode } from 'react';

type Props = {
  children?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function ModalHeader({ children, right, className }: Props) {
  return (
    <div className={`flex items-start justify-between ${className ?? ''}`}>
      <div>{children}</div>
      {right && <div>{right}</div>}
    </div>
  );
}

export default ModalHeader;
