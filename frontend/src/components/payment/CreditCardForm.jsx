import React, { useState } from 'react';
import { Form, Input, Button, Row, Col, Card } from 'antd';
import { CreditCardOutlined, LockOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';

/**
 * Componente para capturar información de tarjetas de crédito manualmente
 */
const CreditCardForm = ({ amount, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const formatCardNumber = (value) => {
    if (!value) return value;
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  const formatExpiryDate = (value) => {
    if (!value) return value;
    const expiry = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (expiry.length >= 2) {
      return `${expiry.substring(0, 2)}/${expiry.substring(2, 4)}`;
    }
    
    return expiry;
  };
  
  const onFinish = (values) => {
    setLoading(true);
    
    // Simula el procesamiento del pago
    setTimeout(() => {
      setLoading(false);
      if (onSubmit) {
        onSubmit({
          cardNumber: values.cardNumber.replace(/\s+/g, ''),
          expiryDate: values.expiryDate,
          cardholderName: values.cardholderName,
          cvv: values.cvv,
          amount
        });
      }
    }, 1500);
  };
  
  return (
    <Card 
      title="Información de Pago" 
      bordered={false}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}
    >
      <Form 
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
      >
        <Form.Item
          label="Número de Tarjeta"
          name="cardNumber"
          rules={[
            { required: true, message: 'Ingrese el número de tarjeta' },
            { min: 13, max: 19, message: 'El número debe tener entre 13 y 19 dígitos' }
          ]}
          getValueFromEvent={(e) => formatCardNumber(e.target.value)}
        >
          <Input 
            prefix={<CreditCardOutlined />} 
            placeholder="1234 5678 9012 3456"
            maxLength={19}
          />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Fecha de Expiración"
              name="expiryDate"
              rules={[{ required: true, message: 'Ingrese fecha de expiración' }]}
              getValueFromEvent={(e) => formatExpiryDate(e.target.value)}
            >
              <Input 
                prefix={<CalendarOutlined />}
                placeholder="MM/AA"
                maxLength={5}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="CVV"
              name="cvv"
              rules={[
                { required: true, message: 'Ingrese el CVV' },
                { len: 3, message: 'El CVV debe tener 3 dígitos' }
              ]}
            >
              <Input 
                prefix={<LockOutlined />}
                type="password"
                placeholder="123"
                maxLength={3}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          label="Nombre del Titular"
          name="cardholderName"
          rules={[{ required: true, message: 'Ingrese el nombre del titular' }]}
        >
          <Input 
            prefix={<UserOutlined />}
            placeholder="Juan Pérez"
          />
        </Form.Item>
        
        <Form.Item>
          <Row justify="space-between" align="middle">
            <Col>Total a pagar: <strong>${amount?.toFixed(2) || '0.00'}</strong></Col>
            <Col>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<CreditCardOutlined />}
              >
                Procesar Pago
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CreditCardForm; 