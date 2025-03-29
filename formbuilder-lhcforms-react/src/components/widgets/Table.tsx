import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

interface TableProps {
  value: Array<{
    operator: string;
    value: string;
  }>;
  onChange: (value: Array<{ operator: string; value: string }>) => void;
  options: Array<{
    extUrl: string;
    display: string;
  }>;
  selectedOptions: Set<string>;
}

export const Table: React.FC<TableProps> = ({
  value = [],
  onChange,
  options = [],
  selectedOptions
}) => {
  const [newRow, setNewRow] = useState<{ operator: string; value: string }>({
    operator: '',
    value: ''
  });

  const handleAddRow = () => {
    if (newRow.operator && newRow.value) {
      onChange([...value, { ...newRow }]);
      setNewRow({ operator: '', value: '' });
    }
  };

  const handleDeleteRow = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const handleUpdateRow = (index: number, field: 'operator' | 'value', newValue: string) => {
    const updatedValue = [...value];
    updatedValue[index] = {
      ...updatedValue[index],
      [field]: newValue
    };
    onChange(updatedValue);
  };

  const getAvailableOptions = () => {
    return options.filter(option => {
      const optionKey = option.extUrl.split('/').pop() || '';
      return !selectedOptions.has(optionKey);
    });
  };

  return (
    <div className="table-responsive">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Operator</th>
            <th>Value</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {value.map((row, index) => (
            <tr key={index}>
              <td>
                <select
                  className="form-select form-select-sm"
                  value={row.operator}
                  onChange={(e) => handleUpdateRow(index, 'operator', e.target.value)}
                >
                  <option value="">{row.operator}</option>
                  {options.map((option) => (
                    <option
                      key={option.extUrl}
                      value={option.extUrl.split('/').pop()}
                      disabled={selectedOptions.has(option.extUrl.split('/').pop() || '')}
                    >
                      {option.display}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={row.value}
                  onChange={(e) => handleUpdateRow(index, 'value', e.target.value)}
                />
              </td>
              <td>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteRow(index)}
                  title="Delete restriction"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <select
                className="form-select form-select-sm"
                value={newRow.operator}
                onChange={(e) => setNewRow({ ...newRow, operator: e.target.value })}
              >
                <option value="">Select operator</option>
                {getAvailableOptions().map((option) => (
                  <option
                    key={option.extUrl}
                    value={option.extUrl.split('/').pop()}
                  >
                    {option.display}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input
                type="text"
                className="form-control form-control-sm"
                value={newRow.value}
                onChange={(e) => setNewRow({ ...newRow, value: e.target.value })}
                placeholder="Enter value"
              />
            </td>
            <td>
              <button
                className="btn btn-sm btn-success"
                onClick={handleAddRow}
                disabled={!newRow.operator || !newRow.value}
                title="Add restriction"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};