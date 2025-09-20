import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, Save, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import { useAuth } from '../hooks/useAuth'

export default function ReportFormPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    license_number: '',
    violation_details: '',
    violation_type: '',
    severity: 'medium' as 'low' | 'medium' | 'high'
  })

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !product) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          product_id: product.id,
          reporter_id: user.id,
          license_number: formData.license_number,
          violation_details: formData.violation_details,
          violation_type: formData.violation_type,
          severity: formData.severity
        })

      if (error) throw error

      // Update product compliance status
      await supabase
        .from('products')
        .update({ compliance_status: 'non-compliant' })
        .eq('id', product.id)

      navigate('/dashboard')
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Compliance Report</h1>

        {/* Product Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <p className="mt-1 text-sm text-gray-900">{product.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
              <p className="mt-1 text-sm text-gray-900">{product.manufacturer || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">MRP</label>
              <p className="mt-1 text-sm text-gray-900">₹{product.mrp || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Net Quantity</label>
              <p className="mt-1 text-sm text-gray-900">{product.net_quantity || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country of Origin</label>
              <p className="mt-1 text-sm text-gray-900">{product.country_of_origin || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Platform</label>
              <p className="mt-1 text-sm text-gray-900">{product.platform || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Report Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
              License Number
            </label>
            <input
              type="text"
              id="license_number"
              name="license_number"
              value={formData.license_number}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your license number"
            />
          </div>

          <div>
            <label htmlFor="violation_type" className="block text-sm font-medium text-gray-700 mb-2">
              Violation Type
            </label>
            <select
              id="violation_type"
              name="violation_type"
              value={formData.violation_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select violation type</option>
              <option value="missing_mrp">Missing MRP</option>
              <option value="missing_manufacturer">Missing Manufacturer Details</option>
              <option value="missing_net_quantity">Missing Net Quantity</option>
              <option value="missing_country_origin">Missing Country of Origin</option>
              <option value="missing_consumer_care">Missing Consumer Care Details</option>
              <option value="incorrect_information">Incorrect Information</option>
              <option value="misleading_claims">Misleading Claims</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level
            </label>
            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="violation_details" className="block text-sm font-medium text-gray-700 mb-2">
              Violation Details *
            </label>
            <textarea
              id="violation_details"
              name="violation_details"
              value={formData.violation_details}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the compliance violation in detail..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}