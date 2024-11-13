import axios from 'axios';
import FormData from 'form-data';

const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
const pinataSecretApiKey = import.meta.env.VITE_PINATA_SECRET_API_KEY;

const pinFileToIPFS = async (file, options) => {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const formData = new FormData();

  formData.append('file', file);

  if (options) {
    formData.append('pinataMetadata', JSON.stringify(options.pinataMetadata));
  }

  const response = await axios.post(url, formData, {
    maxBodyLength: Infinity,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretApiKey
    }
  });

  return response.data;
};

export default { pinFileToIPFS };
