import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Card, Alert, Row, Col, Typography, Divider } from 'antd';
import { DollarOutlined, CalculatorOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Componente para procesar pagos en efectivo
 */
const CashPaymentForm = ({ amount, onSubmit }) => {
  const [form] = Form.useForm();
  const [cashAmount, setCashAmount] = useState(amount || 0);
  const [change, setChange] = useState(0);
  
  useEffect(() => {
    // Actualizar el cambio cada vez que cambia el monto en efectivo
    calculateChange(cashAmount);
  }, [cashAmount, amount]);
  
  const calculateChange = (cash) => {
    const changeAmount = cash - amount;
    setChange(changeAmount >= 0 ? changeAmount : 0);
  };
  
  const handleCashAmountChange = (value) => {
    setCashAmount(value || 0);
  };
  
  const handleExactAmountClick = () => {
    setCashAmount(amount);
    form.setFieldsValue({ cashAmount: amount });
  };

  const handleCommonAmountClick = (value) => {
    setCashAmount(value);
    form.setFieldsValue({ cashAmount: value });
  };
  
  const handleSubmit = () => {
    if (cashAmount >= amount) {
      if (onSubmit) {
        onSubmit({
          cashAmount,
          changeAmount: change,
          amount
        });
      }
    }
  };
  
  // Genera denominaciones comunes basadas en el monto
  const getCommonDenominations = () => {
    const roundedAmount = Math.ceil(amount / 10) * 10;
    return [
      roundedAmount,
      roundedAmount + 10,
      roundedAmount + 50,
      Math.max(100, roundedAmount)
    ];
  };

  return (
    <Card title="Pago en Efectivo" bordered={false}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16} align="middle">
          <Col span={16}>
            <Title level={4}>Total a pagar: ${amount?.toFixed(2) || '0.00'}</Title>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Button 
              type="default" 
              onClick={handleExactAmountClick}
              icon={<CalculatorOutlined />}
            >
              Monto exacto
            </Button>
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Monto recibido"
              name="cashAmount"
              rules={[
                { required: true, message: 'Ingrese el monto recibido' },
                { 
                  type: 'number', 
                  min: amount, 
                  message: `El monto mínimo debe ser $${amount?.toFixed(2)}` 
                }
              ]}
              initialValue={cashAmount}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix={<DollarOutlined />}
                precision={2}
                step={0.50}
                min={0}
                onChange={handleCashAmountChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '10px' }}>
              <Text strong>Denominaciones comunes:</Text>
            </div>
            <Row gutter={[8, 8]}>
              {getCommonDenominations().map((value) => (
                <Col span={12} key={value}>
                  <Button 
                    style={{ width: '100%' }} 
                    onClick={() => handleCommonAmountClick(value)}
                  >
                    ${value.toFixed(2)}
                  </Button>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
        
        <Divider />
        
        <Row>
          <Col span={24}>
            <Alert
              message={
                <Row justify="space-between" align="middle">
                  <Col><Text strong>Cambio a devolver:</Text></Col>
                  <Col><Text strong style={{ fontSize: '18px' }}>${change.toFixed(2)}</Text></Col>
                </Row>
              }
              type={cashAmount >= amount ? "success" : "warning"}
              showIcon
              style={{ marginBottom: '20px' }}
            />
          </Col>
        </Row>
        
        <Row justify="end">
          <Col>
            <Button 
              type="primary" 
              htmlType="submit"
              disabled={cashAmount < amount}
              icon={<DollarOutlined />}
              size="large"
            >
              Completar Pago
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default CashPaymentForm; 