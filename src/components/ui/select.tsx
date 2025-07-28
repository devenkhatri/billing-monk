'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

const Select = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  className
}: SelectProps) => {
  const selectedOption = options.find(option => option.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Listbox.Button
          className={clsx(
            'relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            error ? 'border-red-300' : 'border-gray-300',
            className
          )}
        >
          <span className="block truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                className={({ active }) =>
                  clsx(
                    'relative cursor-default select-none py-2 pl-10 pr-4',
                    active ? 'bg-blue-100 text-blue-900' : 'text-gray-900',
                    option.disabled && 'cursor-not-allowed opacity-50'
                  )
                }
                value={option.value}
                disabled={option.disabled}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={clsx(
                        'block truncate',
                        selected ? 'font-medium' : 'font-normal'
                      )}
                    >
                      {option.label}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

export { Select, type Option };