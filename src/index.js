'use strict'

const fetch = require('isomorphic-unfetch')
const axios = require("axios");

const throwError = ({message, code}) => {
    const error = new Error(`${message}`)
    error.code = code
    throw error
}

const authentication = ({email, key}) =>
    email
        ? {'X-Auth-Email': email, 'X-Auth-Key': key}
        : {Authorization: `Bearer ${key}`}

function CloudFlareWorkersKV(options) {
    if (!(this instanceof CloudFlareWorkersKV)) {
        return new CloudFlareWorkersKV(options)
    }

    const {accountId, email, key, namespaceId} = options

    const auth = authentication({email, key})

    const baseUrl = (key = '') =>
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`

    const fetchOptions = (opts = {}, props) => ({
        ...opts,
        headers: {
            ...opts.headers,
            ...auth
        },
        ...props
    })

    const get = async (keyOfValue, opts) => {

        console.log(key)

        const instance = axios.create({
            baseURL: 'https://api.cloudflare.com/client/v4/accounts/',
            timeout: 100000,
            headers: {
                'Authorization': `Bearer ${key}`
            }
        });

        try {
            var _ = await instance.get(`${accountId}/storage/kv/namespaces/${namespaceId}/values/${keyOfValue}`)
            console.log(_.data)
            return _.data
        } catch (e) {
            console.log(e)
            return undefined
        }

        // const response = await fetch(baseUrl(keyOfValue), fetchOptions(opts))
        // if (response.status === 404) return undefined
        // return response.json()
    }

    const set = async (key, value, ttl, opts = {}) => {
        const url = baseUrl(key)
        const searchParams = new URLSearchParams(
            ttl ? {expiration_ttl: ttl / 1000} : {}
        )

        const {success, errors} = await fetch(
            `${url}?${searchParams.toString()}`,
            fetchOptions(opts, {
                body: typeof value === 'string' ? value : JSON.stringify(value),
                method: 'PUT'
            })
        ).then(res => res.json())

        return success || throwError(errors[0])
    }

    const _delete = async (key, opts) => {
        await fetch(baseUrl(key), fetchOptions(opts, {method: 'DELETE'}))
        return true
    }

    return {get, set, delete: _delete}
}

module.exports = CloudFlareWorkersKV
