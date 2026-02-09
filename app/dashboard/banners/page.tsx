'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Plus, Trash, Image as ImageIcon, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { AddBannerDialog } from '@/components/banners/add-banner-dialog'

interface Banner {
  id: string
  title: string
  image_url: string
  target_type: string
  target_value: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

function BannersPageContent() {
  const supabase = createClient()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const loadBanners = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('app_banners')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadBanners()
  }, [loadBanners])

  const toggleBanner = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('app_banners')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadBanners()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    try {
      const { error } = await supabase.from('app_banners').delete().eq('id', id)
      if (error) throw error
      toast.success('Banner deleted')
      loadBanners()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App Banners</h1>
          <p className="text-gray-600 mt-1">Manage the image slider on the app home screen</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading banners...</p>
        ) : banners.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white border rounded-lg border-dashed">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No banners added yet.</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-all ${!banner.is_active ? 'opacity-60' : ''}`}>
              <div className="aspect-[16/9] relative bg-gray-100">
                <img 
                  src={banner.image_url} 
                  alt={banner.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    onClick={() => toggleBanner(banner.id, banner.is_active)}
                    className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white"
                  >
                    {banner.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                  </button>
                  <button 
                    onClick={() => deleteBanner(banner.id)}
                    className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-red-50 text-red-600"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">Order: {banner.display_order}</span>
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{banner.target_type}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AddBannerDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onSuccess={loadBanners} 
      />
    </div>
  )
}

export default function BannersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BannersPageContent />
    </Suspense>
  )
}
