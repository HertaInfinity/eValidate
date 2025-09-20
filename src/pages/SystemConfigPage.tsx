import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Rule } from '../types'
import { useAuth } from '../hooks/useAuth'

export default function SystemConfigPage() {
  const { user } = useAuth()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [formData, setFormData] = useState({
    rule_name: '',
    field_to_validate: '',
    rule_type: 'presence' as 'presence' | 'regex' | 'list' | 'range' | 'custom',
    rule_value: '',
    description: '',
    is_active: true
  })

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRules(data || [])
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      let ruleValue: any = formData.rule_value

      // Parse rule value based on type
      if (formData.rule_type === 'list') {
        ruleValue = formData.rule_value.split(',').map(v => v.trim())
      } else if (formData.rule_type === 'range') {
        const [min, max] = formData.rule_value.split('-').map(v => parseFloat(v.trim()))
        ruleValue = { min, max }
      } else if (formData.rule_type === 'presence') {
        ruleValue = { required: true }
      }

      const ruleData = {
        rule_name: formData.rule_name,
        field_to_validate: formData.field_to_validate,
        rule_type: formData.rule_type,
        rule_value: ruleValue,
        description: formData.description,
        is_active: formData.is_active,
        created_by: user.id
      }

      if (editingRule) {
        const { error } = await supabase
          .from('rules')
          .update(ruleData)
          .eq('id', editingRule.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('rules')
          .insert(ruleData)
        if (error) throw error
      }

      await fetchRules()
      resetForm()
    } catch (error) {
      console.error('Error saving rule:', error)
    }
  }

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule)
    setFormData({
      rule_name: rule.rule_name,
      field_to_validate: rule.field_to_validate,
      rule_type: rule.rule_type,
      rule_value: formatRuleValue(rule.rule_value, rule.rule_type),
      description: rule.description || '',
      is_active: rule.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId)

      if (error) throw error
      await fetchRules()
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const toggleRuleStatus = async (rule: Rule) => {
    try {
      const { error } = await supabase
        .from('rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id)

      if (error) throw error
      await fetchRules()
    } catch (error) {
      console.error('Error updating rule status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      rule_name: '',
      field_to_validate: '',
      rule_type: 'presence',
      rule_value: '',
      description: '',
      is_active: true
    })
    setEditingRule(null)
    setShowForm(false)
  }

  const formatRuleValue = (value: any, type: string): string => {
    if (type === 'list' && Array.isArray(value)) {
      return value.join(', ')
    } else if (type === 'range' && typeof value === 'object') {
      return `${value.min}-${value.max}`
    }
    return typeof value === 'string' ? value : JSON.stringify(value)
  }

  const getRuleTypeDescription = (type: string) => {
    switch (type) {
      case 'presence': return 'Field must be present'
      case 'regex': return 'Field must match pattern'
      case 'list': return 'Field must be in allowed list'
      case 'range': return 'Field must be within range'
      case 'custom': return 'Custom validation logic'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600 mt-2">Manage compliance rules for Legal Metrology validation</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Rule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRule ? 'Edit Rule' : 'Add New Rule'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.rule_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., MRP Required"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field to Validate *
                  </label>
                  <select
                    value={formData.field_to_validate}
                    onChange={(e) => setFormData(prev => ({ ...prev, field_to_validate: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select field</option>
                    <option value="name">Product Name</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="mrp">MRP</option>
                    <option value="net_quantity">Net Quantity</option>
                    <option value="country_of_origin">Country of Origin</option>
                    <option value="consumer_care_details">Consumer Care Details</option>
                    <option value="date_of_manufacture">Date of Manufacture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Type *
                  </label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_type: e.target.value as any }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="presence">Presence Check</option>
                    <option value="regex">Regex Pattern</option>
                    <option value="list">Allowed Values List</option>
                    <option value="range">Numeric Range</option>
                    <option value="custom">Custom Logic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Value *
                  </label>
                  <input
                    type="text"
                    value={formData.rule_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_value: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      formData.rule_type === 'list' ? 'value1, value2, value3' :
                      formData.rule_type === 'range' ? '0-1000' :
                      formData.rule_type === 'regex' ? '^[A-Z]{2}$' :
                      'Rule configuration'
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.rule_type === 'list' && 'Comma-separated values'}
                    {formData.rule_type === 'range' && 'Format: min-max (e.g., 0-1000)'}
                    {formData.rule_type === 'regex' && 'Regular expression pattern'}
                    {formData.rule_type === 'presence' && 'Leave as "required" for presence check'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this rule validates..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Rule is active
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Rules</h2>
          
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rules configured</h3>
              <p className="text-gray-600">Add your first compliance rule to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`border rounded-lg p-4 ${rule.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`font-medium ${rule.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {rule.rule_name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Field:</span>
                          <span className="ml-2 font-medium">{rule.field_to_validate}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 font-medium">{getRuleTypeDescription(rule.rule_type)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Value:</span>
                          <span className="ml-2 font-medium">{formatRuleValue(rule.rule_value, rule.rule_type)}</span>
                        </div>
                      </div>
                      
                      {rule.description && (
                        <p className="text-sm text-gray-600 mt-2">{rule.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleRuleStatus(rule)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          rule.is_active 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {rule.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}