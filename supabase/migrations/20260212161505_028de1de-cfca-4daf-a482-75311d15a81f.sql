
CREATE OR REPLACE FUNCTION public.create_booking(
  p_customer_name text,
  p_customer_phone text,
  p_panchayath_id uuid DEFAULT NULL,
  p_landmark text DEFAULT NULL,
  p_property_sqft integer DEFAULT NULL,
  p_scheduled_date date DEFAULT NULL,
  p_scheduled_time time DEFAULT NULL,
  p_special_instructions text DEFAULT NULL,
  p_base_price numeric DEFAULT 0,
  p_addon_price numeric DEFAULT 0,
  p_total_price numeric DEFAULT 0,
  p_package_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking_number text;
  v_booking_id uuid;
BEGIN
  v_booking_number := 'HR' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  INSERT INTO public.bookings (
    booking_number, customer_name, customer_phone, customer_email,
    address_line1, city, pincode,
    panchayath_id, landmark, property_sqft,
    scheduled_date, scheduled_time, special_instructions,
    base_price, addon_price, total_price, package_id,
    customer_user_id
  ) VALUES (
    v_booking_number, p_customer_name, p_customer_phone, '',
    '', 'N/A', 'N/A',
    p_panchayath_id, p_landmark, p_property_sqft,
    p_scheduled_date, p_scheduled_time, p_special_instructions,
    p_base_price, p_addon_price, p_total_price, p_package_id,
    auth.uid()
  )
  RETURNING id INTO v_booking_id;
  
  RETURN jsonb_build_object('id', v_booking_id, 'booking_number', v_booking_number);
END;
$$;
