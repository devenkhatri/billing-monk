import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
  sortable?: boolean;
  onSort?: () => void;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

const Table = ({ children, className }: TableProps) => (
  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
    <table className={clsx('min-w-full divide-y divide-gray-300', className)}>
      {children}
    </table>
  </div>
);

const TableHeader = ({ children, className }: TableHeaderProps) => (
  <thead className={clsx('bg-gray-50', className)}>
    {children}
  </thead>
);

const TableBody = ({ children, className }: TableBodyProps) => (
  <tbody className={clsx('divide-y divide-gray-200 bg-white', className)}>
    {children}
  </tbody>
);

const TableRow = ({ children, className, onClick }: TableRowProps) => (
  <tr 
    className={clsx(
      onClick && 'cursor-pointer hover:bg-gray-50',
      className
    )}
    onClick={onClick}
  >
    {children}
  </tr>
);

const TableHead = ({ children, className, sortable, onSort }: TableHeadProps) => (
  <th 
    className={clsx(
      'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      sortable && 'cursor-pointer hover:bg-gray-100',
      className
    )}
    onClick={sortable ? onSort : undefined}
  >
    <div className="flex items-center space-x-1">
      <span>{children}</span>
      {sortable && (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      )}
    </div>
  </th>
);

const TableCell = ({ children, className }: TableCellProps) => (
  <td className={clsx('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}>
    {children}
  </td>
);

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };