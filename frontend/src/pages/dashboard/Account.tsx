import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Account() {
  const [accountData, setAccountData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      const res = await api.get('/account');
      setAccountData(res.data);
    } catch (error) {
      console.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!accountData) {
    return <div>Failed to load account data</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Account Information</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">DID</p>
            <p className="font-semibold font-mono text-sm">{accountData.did}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Role</p>
            <p className="font-semibold">{accountData.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Trust Score</p>
            <p className="font-semibold">{accountData.trustScore?.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-semibold">{accountData.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mobile</p>
            <p className="font-semibold">{accountData.mobile || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Registered On</p>
            <p className="font-semibold">
              {new Date(accountData.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {accountData.role === 'FARMER' && (
          <div className="mt-6 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Farmer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Business Name</p>
                <p className="font-semibold">{accountData.businessName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold">{accountData.address || 'N/A'}</p>
              </div>
              {accountData.pmKisan && (
                <div>
                  <p className="text-sm text-gray-600">PM-KISAN ID</p>
                  <p className="font-semibold">{accountData.pmKisan}</p>
                </div>
              )}
              {accountData.aadhaar && (
                <div>
                  <p className="text-sm text-gray-600">Aadhaar</p>
                  <p className="font-semibold">{accountData.aadhaar}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {accountData.role === 'TRANSPORTER' && (
          <div className="mt-6 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Transporter Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Company Name</p>
                <p className="font-semibold">{accountData.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold">{accountData.address || 'N/A'}</p>
              </div>
              {accountData.vehicleRC && (
                <div>
                  <p className="text-sm text-gray-600">Vehicle RC</p>
                  <p className="font-semibold">{accountData.vehicleRC}</p>
                </div>
              )}
              {accountData.driverLicense && (
                <div>
                  <p className="text-sm text-gray-600">Driver License</p>
                  <p className="font-semibold">{accountData.driverLicense}</p>
                </div>
              )}
              {accountData.gstin && (
                <div>
                  <p className="text-sm text-gray-600">GSTIN</p>
                  <p className="font-semibold">{accountData.gstin}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {accountData.role === 'RETAILER' && (
          <div className="mt-6 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Retailer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Shop Name</p>
                <p className="font-semibold">{accountData.shopName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold">{accountData.address || 'N/A'}</p>
              </div>
              {accountData.gstin && (
                <div>
                  <p className="text-sm text-gray-600">GSTIN</p>
                  <p className="font-semibold">{accountData.gstin}</p>
                </div>
              )}
              {accountData.pan && (
                <div>
                  <p className="text-sm text-gray-600">PAN</p>
                  <p className="font-semibold">{accountData.pan}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {accountData.role === 'CONSUMER' && (
          <div className="mt-6 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Consumer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{accountData.name || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <h2 className="text-xl font-semibold mb-4">Public Key</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="font-mono text-xs break-all">{accountData.publicKey}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


