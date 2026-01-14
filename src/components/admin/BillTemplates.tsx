'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Bill, Member } from '@/types';

interface Template {
  id: string;
  name: string;
  description: string;
  members: string[]; // member names
  createdAt: Date;
}

interface BillTemplatesProps {
  bill: Bill;
  onApplyTemplate: (memberNames: string[]) => void;
}

export default function BillTemplates({ bill, onApplyTemplate }: BillTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bill-templates');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const saveTemplate = () => {
    if (!templateName.trim()) return;

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templateName.trim(),
      description: templateDescription.trim(),
      members: bill.members.map(m => m.name),
      createdAt: new Date(),
    };

    const updated = [...templates, newTemplate];
    setTemplates(updated);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('bill-templates', JSON.stringify(updated));
    }

    setTemplateName('');
    setTemplateDescription('');
    setShowSaveTemplate(false);
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem('bill-templates', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bill Templates</h2>
            <p className="text-sm text-gray-600 mt-1">Save and reuse member lists</p>
          </div>
          <Button
            onClick={() => setShowSaveTemplate(true)}
            size="sm"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            💾 Save Current
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-6xl mb-4">📋</p>
            <p className="text-lg font-medium">No templates yet</p>
            <p className="text-sm mt-1">Save your current member list as a template</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="bg-gradient-to-br from-gray-50 to-emerald-50 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                  </div>
                  <Badge variant="info">{template.members.length}</Badge>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Members:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.members.slice(0, 5).map((name, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200"
                      >
                        {name}
                      </span>
                    ))}
                    {template.members.length > 5 && (
                      <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-500 border border-gray-200">
                        +{template.members.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => onApplyTemplate(template.members)}
                    size="sm"
                    fullWidth
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Apply
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm(`Delete template "${template.name}"?`)) {
                        deleteTemplate(template.id);
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Save Template Modal */}
      <Modal
        isOpen={showSaveTemplate}
        onClose={() => {
          setShowSaveTemplate(false);
          setTemplateName('');
          setTemplateDescription('');
        }}
        title="Save as Template"
      >
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-800">
              Current members ({bill.members.length}): {bill.members.map(m => m.name).join(', ')}
            </p>
          </div>

          <Input
            label="Template Name"
            placeholder="e.g., Office Lunch Group"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            autoFocus
          />

          <Input
            label="Description (optional)"
            placeholder="e.g., Regular Friday lunch crew"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
          />

          <div className="flex gap-2">
            <Button
              onClick={saveTemplate}
              fullWidth
              disabled={!templateName.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              💾 Save Template
            </Button>
            <Button
              onClick={() => {
                setShowSaveTemplate(false);
                setTemplateName('');
                setTemplateDescription('');
              }}
              variant="secondary"
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
