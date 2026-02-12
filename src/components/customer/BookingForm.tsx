import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Phone, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BookingFormProps {
  totalPrice: number;
  onSubmit: (data: BookingFormData) => void;
  isLoading?: boolean;
}

export interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  pincode: string;
  floor_number: number;
  property_sqft: number;
  scheduled_date: string;
  scheduled_time: string;
  special_instructions: string;
}

export function BookingForm({ totalPrice, onSubmit, isLoading }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    address_line1: '',
    address_line2: '',
    city: 'Chennai',
    pincode: '',
    floor_number: 0,
    property_sqft: 0,
    scheduled_date: '',
    scheduled_time: '09:00',
    special_instructions: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Customer Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4" />
          Contact Details
        </h4>
        
        <div className="grid gap-4">
          <div>
            <Label htmlFor="customer_name">Full Name *</Label>
            <Input
              id="customer_name"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="customer_email"
                  name="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="customer_phone">Phone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="customer_phone"
                  name="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Service Address
        </h4>
        
        <div className="grid gap-4">
          <div>
            <Label htmlFor="address_line1">Address Line 1 *</Label>
            <Input
              id="address_line1"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              placeholder="Street address, building name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              placeholder="Apartment, suite, landmark"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="600001"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="floor_number">Floor Number</Label>
              <Input
                id="floor_number"
                name="floor_number"
                type="number"
                min="0"
                value={formData.floor_number}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="property_sqft">Property Size (sq.ft)</Label>
              <Input
                id="property_sqft"
                name="property_sqft"
                type="number"
                min="0"
                value={formData.property_sqft}
                onChange={handleChange}
                placeholder="1000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="scheduled_date">Date *</Label>
            <Input
              id="scheduled_date"
              name="scheduled_date"
              type="date"
              min={minDate}
              value={formData.scheduled_date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="scheduled_time">Time *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="scheduled_time"
                name="scheduled_time"
                type="time"
                min="08:00"
                max="18:00"
                value={formData.scheduled_time}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      <div className="space-y-2">
        <Label htmlFor="special_instructions" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Special Instructions
        </Label>
        <Textarea
          id="special_instructions"
          name="special_instructions"
          value={formData.special_instructions}
          onChange={handleChange}
          placeholder="Any specific requirements or instructions..."
          rows={3}
        />
      </div>

      {/* Total */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-2xl font-bold text-brand-teal">
            ₹{totalPrice.toLocaleString()}
          </span>
        </div>
        
        <Button 
          type="submit" 
          variant="hero" 
          size="xl" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Confirming...' : 'Confirm Booking'}
        </Button>
      </div>
    </motion.form>
  );
}
